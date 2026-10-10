from app.core.security import create_access_token
from bson import ObjectId
import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_task_import_valid_and_isolation(client: AsyncClient):
    email_a = f"test_a_{uuid.uuid4().hex[:8]}@ayetasks.com"
    token_a = create_access_token(subject=str(ObjectId()), extra_claims={"email": email_a, "name": "A"})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    email_b = f"test_b_{uuid.uuid4().hex[:8]}@ayetasks.com"
    token_b = create_access_token(subject=str(ObjectId()), extra_claims={"email": email_b, "name": "B"})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    payload = {
        "format": "ayetasks.import",
        "version": 1,
        "source": "manual",
        "tasks": [
            {
                "ref": "diseno",
                "title": "Diseñar pantalla de importación",
                "date": "2026-10-12",
                "type": "task",
                "description": "Modal con área para pegar el JSON",
                "priority": "high",
                "estimatedMinutes": 90,
                "dueDate": "2026-10-14",
                "dueTime": "18:00",
                "color": "#00e5ff",
                "comments": ["Revisar con agy"]
            },
            {
                "ref": "endpoint",
                "title": "Endpoint de importación",
                "date": "2026-10-13",
                "status": "in_progress",
                "parent": "diseno"
            },
            {
                "title": "Daily",
                "date": "2026-10-13",
                "type": "event",
                "startTime": "10:00",
                "endTime": "10:15",
                "location": "Meet"
            }
        ],
        "connections": [
            { "from": "diseno", "to": "endpoint", "type": "dependency", "label": "bloquea" }
        ]
    }

    # Dry run
    res_dry = await client.post("/api/v1/tasks/import?dry_run=true", json=payload, headers=headers_a)
    assert res_dry.status_code == 200
    assert res_dry.json()["summary"]["tasks"] == 2
    assert res_dry.json()["summary"]["events"] == 1
    assert res_dry.json()["summary"]["connections"] == 1

    # Check no tasks created
    tasks_before = await client.get("/api/v1/tasks/", headers=headers_a)
    assert len(tasks_before.json()) == 0

    # Import real
    res = await client.post("/api/v1/tasks/import", json=payload, headers=headers_a)
    assert res.status_code == 201
    data = res.json()
    assert len(data["tasks"]) == 3
    assert len(data["connections"]) == 1
    assert data["connections"][0]["type"] == "dependency"
    assert data["connections"][0]["label"] == "bloquea"
    assert "diseno" in data["refs"]
    assert "endpoint" in data["refs"]

    # Get tasks
    tasks_after = await client.get("/api/v1/tasks/", headers=headers_a)
    t_list = tasks_after.json()
    assert len(t_list) == 3

    in_prog = next(t for t in t_list if t["title"] == "Endpoint de importación")
    assert in_prog["status"] == "in_progress"
    dis = next(t for t in t_list if t["title"] == "Diseñar pantalla de importación")
    assert dis["status"] == "todo"

    # User B isolation
    tasks_b = await client.get("/api/v1/tasks/", headers=headers_b)
    assert len(tasks_b.json()) == 0


@pytest.mark.asyncio
async def test_task_import_hija_sin_ref_con_parent(client: AsyncClient):
    email = f"test_noref_{uuid.uuid4().hex[:8]}@ayetasks.com"
    token = create_access_token(subject=str(ObjectId()), extra_claims={"email": email, "name": "User"})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "format": "ayetasks.import",
        "version": 1,
        "tasks": [
            {"ref": "A", "title": "A", "date": "2026-10-12"},
            {"title": "B", "date": "2026-10-12", "parent": "A"}
        ]
    }

    res = await client.post("/api/v1/tasks/import", json=payload, headers=headers)
    assert res.status_code == 201
    assert len(res.json()["connections"]) == 1


@pytest.mark.asyncio
async def test_task_import_event_valid_times(client: AsyncClient):
    email = f"test_ev_{uuid.uuid4().hex[:8]}@ayetasks.com"
    token = create_access_token(subject=str(ObjectId()), extra_claims={"email": email, "name": "User"})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "format": "ayetasks.import",
        "version": 1,
        "tasks": [
            {"title": "E1", "date": "2026-10-12", "type": "event", "startTime": "09:30", "endTime": "10:00"}
        ]
    }

    res = await client.post("/api/v1/tasks/import", json=payload, headers=headers)
    assert res.status_code == 201


@pytest.mark.asyncio
async def test_task_import_errors(client: AsyncClient):
    email = f"test_err_{uuid.uuid4().hex[:8]}@ayetasks.com"
    token = create_access_token(subject=str(ObjectId()), extra_claims={"email": email, "name": "User"})
    headers = {"Authorization": f"Bearer {token}"}

    base = {
        "format": "ayetasks.import",
        "version": 1,
        "tasks": [{"title": "T1", "date": "2026-10-12"}]
    }

    # falta title
    p1 = dict(base, tasks=[{"date": "2026-10-12"}])
    r1 = await client.post("/api/v1/tasks/import", json=p1, headers=headers)
    assert r1.status_code == 422
    assert r1.json()["detail"]["code"] == "IMPORT_INVALID"
    assert any(e["path"] == "tasks[0].title" for e in r1.json()["detail"]["errors"])

    # clave desconocida "titel"
    p2 = dict(base, tasks=[{"titel": "T", "date": "2026-10-12"}])
    r2 = await client.post("/api/v1/tasks/import", json=p2, headers=headers)
    assert r2.status_code == 422
    assert any(e["path"] == "tasks[0].titel" for e in r2.json()["detail"]["errors"])

    # fecha 2026-02-30
    p3 = dict(base, tasks=[{"title": "T", "date": "2026-02-30"}])
    r3 = await client.post("/api/v1/tasks/import", json=p3, headers=headers)
    assert r3.status_code == 422
    assert any(e["path"] == "tasks[0].date" for e in r3.json()["detail"]["errors"])

    # date "2026-1-5": 422 en tasks[0].date
    p_date = dict(base, tasks=[{"title": "T", "date": "2026-1-5"}])
    r_date = await client.post("/api/v1/tasks/import", json=p_date, headers=headers)
    assert r_date.status_code == 422
    assert any(e["path"] == "tasks[0].date" for e in r_date.json()["detail"]["errors"])

    # startTime "9:30": 422 en tasks[0].startTime
    p_time = dict(base, tasks=[{"title": "T", "date": "2026-10-12", "startTime": "9:30"}])
    r_time = await client.post("/api/v1/tasks/import", json=p_time, headers=headers)
    assert r_time.status_code == 422
    assert any(e["path"] == "tasks[0].startTime" for e in r_time.json()["detail"]["errors"])

    # parent a un ref inexistente
    p4 = dict(base, tasks=[{"title": "T", "date": "2026-10-12", "parent": "nope"}])
    r4 = await client.post("/api/v1/tasks/import", json=p4, headers=headers)
    assert r4.status_code == 422
    assert any(e["path"] == "tasks[0].parent" for e in r4.json()["detail"]["errors"])

    # ciclo de dos tareas
    p5 = dict(base, tasks=[
        {"ref": "A", "title": "A", "date": "2026-10-12", "parent": "B"},
        {"ref": "B", "title": "B", "date": "2026-10-12", "parent": "A"}
    ])
    r5 = await client.post("/api/v1/tasks/import", json=p5, headers=headers)
    assert r5.status_code == 422
    err_paths = [e["path"] for e in r5.json()["detail"]["errors"]]
    assert err_paths.count("tasks[0].parent") == 1
    assert err_paths.count("tasks[1].parent") == 1

    # 101 tareas
    p6 = dict(base, tasks=[{"title": f"T{i}", "date": "2026-10-12"} for i in range(101)])
    r6 = await client.post("/api/v1/tasks/import", json=p6, headers=headers)
    assert r6.status_code == 422
    assert any(e["path"] == "tasks" for e in r6.json()["detail"]["errors"])

    # version 2
    p7 = dict(base, version=2)
    r7 = await client.post("/api/v1/tasks/import", json=p7, headers=headers)
    assert r7.status_code == 422
    assert any(e["path"] == "version" for e in r7.json()["detail"]["errors"])

    # dueTime sin dueDate
    p8 = dict(base, tasks=[{"title": "T", "date": "2026-10-12", "dueTime": "10:00"}])
    r8 = await client.post("/api/v1/tasks/import", json=p8, headers=headers)
    assert r8.status_code == 422
    assert any(e["path"] == "tasks[0].dueTime" for e in r8.json()["detail"]["errors"])

    # endTime menor que startTime
    p_end = dict(base, tasks=[{"title": "E", "date": "2026-10-12", "type": "event", "startTime": "10:00", "endTime": "09:00"}])
    r_end = await client.post("/api/v1/tasks/import", json=p_end, headers=headers)
    assert r_end.status_code == 422
    assert any(e["path"] == "tasks[0].endTime" for e in r_end.json()["detail"]["errors"])

    # dos errores en el mismo archivo
    p9 = dict(base, tasks=[{"title": "T", "date": "2026-10-32", "parent": "nope"}])
    r9 = await client.post("/api/v1/tasks/import", json=p9, headers=headers)
    assert r9.status_code == 422
    err_paths_9 = [e["path"] for e in r9.json()["detail"]["errors"]]
    assert "tasks[0].date" in err_paths_9
    assert "tasks[0].parent" in err_paths_9

    # cuerpo que es una lista
    r_list = await client.post("/api/v1/tasks/import", json=[{"title": "T", "date": "2026-10-12"}], headers=headers)
    assert r_list.status_code == 422
    assert r_list.json()["detail"]["code"] == "IMPORT_INVALID"
    assert r_list.json()["detail"]["errors"][0]["path"] == ""


    # ref igual a una lista y parent igual a un objeto
    p_types = dict(base, tasks=[
        {"ref": ["invalid"], "title": "A", "date": "2026-10-12"},
        {"parent": {"invalid": True}, "title": "B", "date": "2026-10-12"}
    ])
    r_types = await client.post("/api/v1/tasks/import", json=p_types, headers=headers)
    assert r_types.status_code == 422
    assert r_types.json()["detail"]["code"] == "IMPORT_INVALID"

    # ciclo de A y B; C cuelga de A, D cuelga de C. C y D no deben estar en el error.
    p_cycle = dict(base, tasks=[
        {"ref": "A", "title": "A", "date": "2026-10-12", "parent": "B"},
        {"ref": "B", "title": "B", "date": "2026-10-12", "parent": "A"},
        {"ref": "C", "title": "C", "date": "2026-10-12", "parent": "A"},
        {"title": "D", "date": "2026-10-12", "parent": "C"}
    ])
    r_cycle = await client.post("/api/v1/tasks/import", json=p_cycle, headers=headers)
    assert r_cycle.status_code == 422
    err_paths_cycle = [e["path"] for e in r_cycle.json()["detail"]["errors"]]
    assert err_paths_cycle.count("tasks[0].parent") == 1
    assert err_paths_cycle.count("tasks[1].parent") == 1
    assert "tasks[2].parent" not in err_paths_cycle
    assert "tasks[3].parent" not in err_paths_cycle
