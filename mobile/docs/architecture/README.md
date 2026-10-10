# Arquitectura del cliente (AyeTasks mobile)

Este directorio existe para que un agente de IA (o una persona) que va a
tocar UI en este repo revise **primero** si ya existe una pieza reutilizable
antes de escribir una nueva. Léelo antes de crear un componente, hook o store
nuevo en `mobile/src/`.

Contienen rutas exactas, no descripciones vagas — verifica que el archivo
referenciado siga existiendo antes de asumir el patrón como vigente.
Reglas de estilos: [`GEMINI.md`](../../../GEMINI.md) en la raíz del repo.

## Estructura de carpetas (`mobile/src/`, verificada 2026-10-09)

| Carpeta | Qué va ahí |
|---|---|
| `constants/theme.ts` | Única fuente de verdad de tokens: `DARK_THEME`, `LIGHT_THEME`, `THEME` (spacing, radius, borders, fonts). |
| `hooks/` | `useTheme` (colores del tema activo), `useSyncSocket` (WebSocket `/ws/sync`). |
| `store/` | Estado global con Zustand: `useTaskStore`, `useTimerStore`, `useUIStore` (tema, toasts, modales, filtros), `useAuthStore`, `useLanguageStore`. |
| `services/` | API REST (`api.ts`), sesión (`authStorage.ts`), analítica. |
| `context/` | `CanvasContext` (estado compartido del canvas semanal). |
| `components/ui/` | Componentes compartidos sin dominio: `AyeLogo`, `ToastNotification`. |
| `components/board/` | Tablero semanal: columnas, tarjetas, modales de tarea, dock, widgets. |
| `components/canvas/` | Canvas y conexiones SVG entre tareas, fondo de puntos. |
| `components/auth/`, `settings/`, `navigation/`, `timer/`, `landing/` | Pantallas y piezas por dominio. |
| `i18n/` | Textos (`translations.ts`); se leen con `useTranslation()` de `useLanguageStore`. |
| `utils/`, `types/` | Utilidades sin estado (fechas, plazos, geometría) y tipos compartidos. |

Un componente usado por un solo dominio va en `components/<dominio>/`. Si lo
usan dos o más dominios, va en `components/ui/` y se agrega a la tabla de abajo.

## Piezas compartidas

| Pieza | Archivo | Para qué |
|---|---|---|
| `useTheme()` | `hooks/useTheme.ts` | `colors`, `isDark`, `themeMode`, `toggleTheme`. **Siempre** úsalo para colores. |
| Toasts | `useUIStore.getState().showToast(text, type?, title?, durationMs?, action?, customTheme?)`; se pintan en `components/ui/ToastNotification.tsx` | Avisos al usuario (`info`, `success`, `warning`, `error`, `delete`, `sync`). No hagas un toast propio. |
| `AyeLogo` | `components/ui/AyeLogo.tsx` | Logo (props `width`, `height`, `color`, `style`). |
| `useTranslation()` | `store/useLanguageStore.ts` | Textos visibles; no escribas strings de UI en duro. |

## Índice

- [`pitfalls.md`](./pitfalls.md) — trampas conocidas ya detectadas en el
  repo. Revísalo antes de copiar un componente existente como plantilla.

## Regla general

1. Busca en `components/ui/`, `hooks/` y `store/` si ya hay algo con ese
   propósito (usa `search_graph`/`search_code` del MCP de codebase-memory si
   está disponible, o `grep -r`).
2. Si existe, úsalo — no lo reimplementes.
3. Si creas algo nuevo y reutilizable, ponlo en `components/ui/` y agrega una
   entrada a la tabla de piezas compartidas.
