import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from pydantic import ValidationError
from beanie.operators import In
from app.models.task import Task
from app.models.task_connection import TaskConnection, ConnectionType
from app.models.user import User
from app.models.base import get_link_id
from app.schemas.task_import import ImportRoot
from app.schemas.task import TaskResponse
from app.schemas.connection import ConnectionResponse
from app.services.ws_manager import ws_manager

class TaskImportService:
    @staticmethod
    def _map_task_to_response(t: Task) -> TaskResponse:
        return TaskResponse(
            id=str(t.id),
            title=t.title,
            description=t.description,
            notes=getattr(t, "notes", None),
            date=t.date,
            due_date=t.due_date,
            due_time=t.due_time,
            task_type=getattr(t, "task_type", "task") or "task",
            start_time=getattr(t, "start_time", None),
            end_time=getattr(t, "end_time", None),
            location=getattr(t, "location", None),
            estimated_duration_minutes=t.estimated_duration_minutes,
            actual_duration_seconds=t.actual_duration_seconds,
            status=t.status,
            priority=t.priority,
            color_tag=t.color_tag,
            position_index=t.position_index,
            parent_task_id=str(get_link_id(t.parent_task_id)) if t.parent_task_id else None,
            created_at=t.created_at,
            updated_at=t.updated_at,
            comments=t.comments,
        )

    @staticmethod
    def _validate_relations(data: Dict[str, Any]) -> List[Dict[str, str]]:
        errors = []
        tasks = data.get("tasks", [])
        if not isinstance(tasks, list):
            return errors
        
        connections = data.get("connections", [])
        if not isinstance(connections, list):
            connections = []

        refs = set()
        for i, t in enumerate(tasks):
            if not isinstance(t, dict): continue
            ref = t.get("ref")
            if ref is not None:
                if not isinstance(ref, str):
                    continue
                if ref in refs:
                    errors.append({"path": f"tasks[{i}].ref", "message": f"El ref '{ref}' está duplicado"})
                refs.add(ref)

        parent_map = {}
        for i, t in enumerate(tasks):
            if not isinstance(t, dict): continue
            parent = t.get("parent")
            ref = t.get("ref")
            if parent is not None:
                if not isinstance(parent, str):
                    continue
                if parent not in refs:
                    errors.append({"path": f"tasks[{i}].parent", "message": f"El parent '{parent}' no existe"})
                elif isinstance(ref, str) and parent == ref:
                    errors.append({"path": f"tasks[{i}].parent", "message": "Una tarea no puede ser su propio parent"})
                else:
                    parent_map[i] = parent
        
        # Cycle detection
        reported_cycles = set()
        for i in parent_map:
            visited_indices = []
            curr_i = i
            
            while curr_i is not None:
                if curr_i in visited_indices:
                    cycle_start = visited_indices.index(curr_i)
                    cycle_nodes = visited_indices[cycle_start:]
                    cycle_key = frozenset(cycle_nodes)
                    if cycle_key not in reported_cycles:
                        reported_cycles.add(cycle_key)
                        for node in cycle_nodes:
                            errors.append({"path": f"tasks[{node}].parent", "message": "Se detectó un ciclo en los parent"})
                    break
                
                visited_indices.append(curr_i)
                curr_ref = parent_map.get(curr_i)
                if not curr_ref:
                    break
                curr_i = next((idx for idx, t in enumerate(tasks) if isinstance(t, dict) and t.get("ref") == curr_ref), None)

        connection_pairs = set()
        for i, c in enumerate(connections):
            if not isinstance(c, dict): continue
            valid = True
            from_ref = c.get("from")
            to_ref = c.get("to")
            
            if from_ref is not None:
                if not isinstance(from_ref, str):
                    valid = False
                elif from_ref not in refs:
                    errors.append({"path": f"connections[{i}].from", "message": f"El origen '{from_ref}' de la conexión no existe"})
                    valid = False
                    
            if to_ref is not None:
                if not isinstance(to_ref, str):
                    valid = False
                elif to_ref not in refs:
                    errors.append({"path": f"connections[{i}].to", "message": f"El destino '{to_ref}' de la conexión no existe"})
                    valid = False
                    
            if valid and isinstance(from_ref, str) and isinstance(to_ref, str) and from_ref == to_ref:
                errors.append({"path": f"connections[{i}].to", "message": "El origen y destino de la conexión no pueden ser iguales"})
                valid = False
            
            if valid and from_ref and to_ref:
                pair = (from_ref, to_ref)
                if pair in connection_pairs:
                    errors.append({"path": f"connections[{i}]", "message": "Conexión duplicada en connections"})
                connection_pairs.add(pair)
                
        return errors

    @staticmethod
    async def import_tasks(user: User, data: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
        errors = []
        root = None
        try:
            root = ImportRoot.model_validate(data)
        except ValidationError as e:
            for err in e.errors():
                path = ""
                for loc in err["loc"]:
                    if isinstance(loc, int):
                        path += f"[{loc}]"
                    else:
                        if path:
                            path += f".{loc}"
                        else:
                            path += str(loc)
                
                msg = err["msg"]
                typ = err["type"]
                if typ == "missing":
                    msg = "Falta el campo"
                elif typ == "extra_forbidden":
                    msg = "Clave no permitida"
                elif typ.startswith("string_pattern_mismatch"):
                    msg = "No coincide con el patrón"
                elif typ in ("literal_error", "enum"):
                    msg = "Valor no permitido"
                elif typ == "string_too_long":
                    msg = "Texto demasiado largo"
                elif typ == "string_too_short":
                    msg = "Texto demasiado corto"
                elif typ == "list_too_long":
                    msg = "Lista demasiado larga"
                elif typ == "list_too_short":
                    msg = "Lista demasiado corta"
                elif typ.startswith("greater_than") or typ.startswith("less_than"):
                    msg = "Número fuera de rango"
                elif "type" in typ:
                    msg = "Tipo incorrecto"
                
                if err.get("ctx") and "error" in err["ctx"]:
                    ctx_err = str(err["ctx"]["error"])
                    msg = ctx_err
                if msg.startswith("Value error, "):
                    msg = msg[len("Value error, "):]
                    
                # Errores entre campos de una tarea: el validador indica el campo en ctx["field"]
                if err.get("ctx") and "field" in err["ctx"]:
                    path = f"{path}.{err['ctx']['field']}" if path else err["ctx"]["field"]

                errors.append({"path": path, "message": msg})
            
        # Cross-validation over raw data always
        rel_errors = TaskImportService._validate_relations(data)
        # Avoid duplicating errors on the exact same path
        existing_paths = {e["path"] for e in errors}
        for re in rel_errors:
            if re["path"] not in existing_paths:
                errors.append(re)
            
        if errors or not root:
            raise HTTPException(status_code=422, detail={"code": "IMPORT_INVALID", "errors": errors})

        if dry_run:
            task_count = sum(1 for t in root.tasks if t.type == "task")
            event_count = sum(1 for t in root.tasks if t.type == "event")
            
            conn_count = len(root.connections)
            explicit_pairs = {(c.from_ref, c.to_ref) for c in root.connections}
            for t in root.tasks:
                if t.parent and t.ref:
                    pair = (t.parent, t.ref)
                    if pair not in explicit_pairs:
                        conn_count += 1
                elif t.parent:
                    conn_count += 1
            
            dates = [t.date for t in root.tasks]
            
            return {
                "dry_run": True,
                "summary": {
                    "tasks": task_count,
                    "events": event_count,
                    "connections": conn_count,
                    "date_from": min(dates) if dates else None,
                    "date_to": max(dates) if dates else None,
                }
            }

        import_id = uuid.uuid4().hex
        dates = {t.date for t in root.tasks}
        active_tasks = await Task.find(
            Task.user_id.id == user.id,
            Task.deleted_at == None,
            In(Task.date, list(dates))
        ).to_list()
        
        date_positions = {}
        for d in dates:
            d_tasks = [t for t in active_tasks if t.date == d]
            date_positions[d] = max([t.position_index for t in d_tasks], default=-1) + 1

        task_pos = {}
        for i, t in enumerate(root.tasks):
            task_pos[i] = date_positions[t.date]
            date_positions[t.date] += 1

        in_degree = {i: 0 for i in range(len(root.tasks))}
        for i, t in enumerate(root.tasks):
            if t.parent:
                in_degree[i] += 1
        
        queue = [i for i in range(len(root.tasks)) if in_degree[i] == 0]
        ordered_indices = []
        while queue:
            curr_i = queue.pop(0)
            ordered_indices.append(curr_i)
            curr_ref = root.tasks[curr_i].ref
            if curr_ref:
                for j, t in enumerate(root.tasks):
                    if t.parent == curr_ref:
                        in_degree[j] -= 1
                        if in_degree[j] == 0:
                            queue.append(j)

        created_tasks = []
        created_connections = []
        ref_to_task = {}
        
        explicit_pairs = {(c.from_ref, c.to_ref) for c in root.connections}
        
        try:
            for i in ordered_indices:
                t = root.tasks[i]
                parent_link = ref_to_task[t.parent] if t.parent else None
                new_task = Task(
                    user_id=user,
                    title=t.title,
                    description=t.description,
                    notes=t.notes,
                    date=t.date,
                    due_date=t.due_date,
                    due_time=t.due_time,
                    task_type=t.type,
                    start_time=t.start_time,
                    end_time=t.end_time,
                    location=t.location,
                    estimated_duration_minutes=t.estimated_minutes,
                    priority=t.priority,
                    color_tag=t.color,
                    position_index=task_pos[i],
                    parent_task_id=parent_link,
                    comments=t.comments or [],
                    status=t.status,
                    source=root.source,
                    import_id=import_id
                )
                await new_task.save()
                created_tasks.append(new_task)
                if t.ref:
                    ref_to_task[t.ref] = new_task
                
                if parent_link:
                    pair = (t.parent, t.ref) if t.ref else None
                    if not pair or pair not in explicit_pairs:
                        conn = TaskConnection(
                            user_id=user,
                            from_task_id=parent_link,
                            to_task_id=new_task,
                            type=ConnectionType.FLOW
                        )
                        await conn.save()
                        created_connections.append(conn)

            for c in root.connections:
                from_task = ref_to_task[c.from_ref]
                to_task = ref_to_task[c.to_ref]
                conn = TaskConnection(
                    user_id=user,
                    from_task_id=from_task,
                    to_task_id=to_task,
                    type=c.type,
                    label=c.label
                )
                await conn.save()
                created_connections.append(conn)
            
            await ws_manager.broadcast_to_user(
                str(user.id),
                {
                    "event": "TASKS_IMPORTED",
                    "data": {
                        "import_id": import_id,
                        "count": len(created_tasks)
                    }
                }
            )
            
            return {
                "import_id": import_id,
                "tasks": [TaskImportService._map_task_to_response(t) for t in created_tasks],
                "connections": [ConnectionResponse(
                    id=str(c.id),
                    from_task_id=str(get_link_id(c.from_task_id)),
                    to_task_id=str(get_link_id(c.to_task_id)),
                    type=c.type,
                    label=c.label,
                    created_at=c.created_at
                ) for c in created_connections],
                "refs": {ref: str(t.id) for ref, t in ref_to_task.items()}
            }
            
        except Exception as e:
            for c in created_connections:
                await c.delete()
            for t in created_tasks:
                await t.delete()
            raise HTTPException(status_code=500, detail="IMPORT_FAILED")
