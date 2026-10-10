# Formato de importación de tareas — `ayetasks.import` v1

Contrato oficial para crear tareas en AyeTasks desde un JSON. Lo usan el usuario (pegando el JSON en
la app) y, más adelante, agentes que llamen a la API directamente. La validación vive en el backend
(`POST /api/v1/tasks/import`); este documento y ese endpoint deben decir lo mismo.

Aprobado por el usuario el 2026-10-09.

## Ejemplo

```json
{
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
```

## Raíz

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `format` | string | sí | Exactamente `"ayetasks.import"`. |
| `version` | entero | sí | Exactamente `1`. Otra versión → error. |
| `source` | string | no | Por defecto `"manual"`. Máx. 64 caracteres. Agentes: `"agent:<nombre>"`. Se guarda en cada tarea creada. |
| `tasks` | lista | sí | De 1 a 100 elementos. |
| `connections` | lista | no | Por defecto vacía. Máx. 200 elementos. |

## Tarea (`tasks[i]`)

| Campo | Tipo | Obligatorio | Regla | Campo en el modelo `Task` |
|---|---|---|---|---|
| `title` | string | sí | 1 a 200 caracteres (sin contar espacios de los extremos). | `title` |
| `date` | string | sí | `YYYY-MM-DD`, fecha real del calendario. Columna del tablero donde aparece. | `date` |
| `ref` | string | no | 1 a 64 caracteres, único dentro del archivo. Solo sirve para `parent` y `connections`; no se guarda. | — |
| `type` | string | no | `task` (por defecto) o `event`. | `task_type` |
| `status` | string | no | `todo` (por defecto), `in_progress`, `completed` o `blocked`. | `status` |
| `priority` | string | no | `low`, `medium` (por defecto), `high` o `urgent`. | `priority` |
| `description` | string | no | | `description` |
| `notes` | string | no | Markdown. | `notes` |
| `dueDate` | string | no | `YYYY-MM-DD`, fecha real. | `due_date` |
| `dueTime` | string | no | `HH:MM` de 24 h (00:00–23:59). Requiere `dueDate`. | `due_time` |
| `startTime` | string | no | `HH:MM` de 24 h. | `start_time` |
| `endTime` | string | no | `HH:MM` de 24 h. Si vienen `startTime` y `endTime`, `endTime` debe ser mayor. | `end_time` |
| `location` | string | no | | `location` |
| `estimatedMinutes` | entero | no | 1 a 500000. Por defecto 30. | `estimated_duration_minutes` |
| `color` | string | no | Hex `#rrggbb`. Por defecto `#00c853`. | `color_tag` |
| `comments` | lista de string | no | Cada comentario no vacío. | `comments` |
| `parent` | string | no | Un `ref` de otra tarea **del mismo archivo**. Crea la conexión `flow` padre → hija, igual que `parent_task_id` hoy. | `parent_task_id` |

## Conexión (`connections[i]`)

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `from` | string | sí | `ref` de una tarea del archivo. |
| `to` | string | sí | `ref` de una tarea del archivo, distinto de `from`. |
| `type` | string | no | `flow` (por defecto), `dependency` o `related`. |
| `label` | string | no | Máx. 100 caracteres. |

## Reglas globales

- **Fechas absolutas solamente.** No se aceptan `"mañana"` ni `"+2d"`.
- **Claves desconocidas son error**, en la raíz, en tareas y en conexiones.
- **Todo o nada.** Si hay un solo error, no se crea nada.
- Los `ref` no se repiten. `parent`, `from` y `to` apuntan a `ref` existentes.
- Una tarea no puede ser su propio `parent`, y los `parent` no forman ciclos.
- Un par `from`→`to` no se repite en `connections`.
- Si una conexión de `connections` une el mismo par que un `parent` (padre → hija), **la explícita
  reemplaza a la automática**: se crea una sola conexión, con el `type` y el `label` de la explícita.
  En el ejemplo de arriba, `diseno → endpoint` queda como una sola conexión `dependency` "bloquea".
- Los ciclos solo se prohíben en `parent`. En `connections` se permiten (por ejemplo `related` de ida y vuelta).
- Los errores se reportan **todos**, no solo el primero, cada uno con la ruta del campo que lo causa
  (`tasks[1].parent`, `connections[0].to`, `version`).
- Orden: dentro de un mismo `date`, las tareas importadas quedan después de las que ya existen,
  en el orden del archivo.
- Las tareas creadas guardan `source` y un `import_id` común a toda la importación.

## Respuesta del endpoint

- **Válido con `dry_run=true`:** no escribe nada. Devuelve un resumen: total de tareas, de eventos y
  de conexiones, y las fechas mínima y máxima.
- **Válido sin `dry_run`:** crea todo. Devuelve `import_id`, las tareas creadas (mismo formato que
  `GET /tasks/`), las conexiones creadas y el mapa `ref → id`.
- **Inválido:** HTTP 422 con una lista de errores; cada uno trae la ruta (`tasks[3].date`) y un
  mensaje en español.

## Esquema para agentes

`GET /api/v1/tasks/import/schema` devuelve el JSON Schema de este formato, generado del mismo modelo
que usa la validación.

## Cambios futuros

Un cambio que rompa archivos existentes (renombrar o quitar un campo, volver obligatorio uno
opcional) requiere `version: 2`. Agregar un campo opcional nuevo no cambia la versión.
