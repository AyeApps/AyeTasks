# Reglas del proyecto AyeTasks

## Estilos: colores y medidas solo desde tokens

Todas las rutas son relativas a `mobile/src/`.

La única fuente de verdad para colores, espaciados, radios, bordes, fuentes y tamaños de letra es
`constants/theme.ts`: paleta oscura en `DARK_THEME`, clara en `LIGHT_THEME`, y medidas en `THEME`
(`spacing`, `radius`, `borders`, `fonts`, `text`, `weight`). En los componentes, los colores se leen **siempre** con
`const { colors } = useTheme();` (`hooks/useTheme.ts`), que cambia solo entre claro y oscuro.

### Reglas

1. **No escribas colores literales** (`'#hex'`, `'rgb()'`, `'rgba()'`, `'hsl()'`, ni `'white'`/`'black'`/…)
   fuera de `constants/theme.ts`. Usa siempre `colors.<token>`.
2. **Si ningún token sirve, no inventes el color en el componente.** Detente y propón el token nuevo en
   `constants/theme.ts`: agrégalo a `ThemeColors`, con su valor en `DARK_THEME` **y** en `LIGHT_THEME`,
   como un paso aparte que el usuario tiene que aprobar.
3. **No uses `THEME.colors`.** Es siempre `DARK_THEME`: en modo claro el componente se ve con colores
   oscuros. Usa `colors` de `useTheme()`.
4. **Colores dinámicos van en línea, medidas en `StyleSheet.create`.** `StyleSheet.create` se evalúa una
   sola vez y no conoce el tema. Patrón:
   ```tsx
   const { colors } = useTheme();
   <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderMuted }]} />
   // ...
   const styles = StyleSheet.create({
     card: { padding: THEME.spacing.md, borderWidth: THEME.borders.thick, borderRadius: THEME.radius.sm },
   });
   ```
5. **Espaciado, radios y bordes con su token**, no con el número:
   `4/8/16/24/32/48` → `THEME.spacing.xs/sm/md/lg/xl/xxl`; radios `2/4/6` → `THEME.radius.xs/sm/md`;
   bordes `1/2` → `THEME.borders.thin/thick`. Valores que no están en la escala (ej. `10`, `12`) se
   permiten por ahora; no agregues nuevos sin razón.
6. **Fuente monoespaciada: `THEME.fonts.mono`.** No escribas `'monospace'`, `'Courier'` ni
   `Platform.OS === 'ios' ? ... : ...` a mano (ver `mobile/docs/architecture/pitfalls.md`).
7. **Las variantes visuales reutilizables van en un componente compartido** (`components/ui/`), no
   copiadas entre pantallas. Antes de crear uno, revisa `mobile/docs/architecture/README.md`.
8. **Tres plataformas, un código.** Lo que funciona en web puede no funcionar igual en iOS/Android
   (fuentes, sombras, `position: fixed`, hover). Revisa las tres.

### Mapa rápido: qué token usar (`colors.*`)

| Necesito… | Token |
|---|---|
| Fondo de pantalla | `bgBase` (secundario: `bgSecondary`) |
| Fondo de modal / panel | `bgSurface` |
| Card / tarjeta de tarea | `bgCard` |
| Fondo invertido (botón sólido, chip activo) | `bgInvert` + texto `textInvert` |
| Borde fuerte (estilo brutalista) | `borderColor` |
| Borde neutro / divisor | `borderMuted` |
| Borde de acento / foco | `borderAccent` |
| Texto normal / secundario / apagado | `textPrimary` / `textSecondary` / `textMuted` |
| Placeholder de input | `textMuted` |
| Naranja de marca (CTA, activo) | `accent` (hover/pressed: `accentHover`; fondo suave: `accentSubtle`) |
| Éxito / completado | `accentSuccess` (+ `accentSuccessHover`, `accentSuccessSubtle`) |
| Error / destructivo | `accentDanger` (+ `accentDangerSubtle`) |
| Aviso / en progreso | `accentWarning` (+ `accentWarningSubtle`) |
| Alerta / vencido | `accentAlert` (+ `accentAlertSubtle`) |
| Sombra dura (offset sin blur) | `shadowColor` |
| Puntos del canvas | `gridDotColor` |
| Plazo de entrega (urgente → largo) | `deadlineUrgent`, `deadlineSoon`, `deadlineWeeks`, `deadlineMonths`, `deadlineLong` (+ `*Subtle`) |

### Tipografía (`THEME.text` y `THEME.weight`, desde 2026-10-09)

Tamaños por rol: `micro` 9, `caption` 10, `small` 11, `label` 12, `body` 13, `bodyLg` 16, `title` 18,
`heading` 22, `display` 28, `hero` 40. Pesos: `regular` '400', `semibold` '600', `bold` '700',
`heavy` '800', `black` '900'. No escribas `fontSize: 12` ni `fontWeight: '900'`: usa el token.

Al migrar un archivo viejo, cada tamaño va al token más cercano (8 → `micro`, 14 → `body`,
15 y 17 → `bodyLg`/`title`, 20 y 24 → `heading`, 26 → `display`, 36 y 44 → `hero`; pesos 500 → `semibold`,
300 → `regular`). Un cambio de más de 2px se consulta con el usuario antes.

### Colores de fecha límite y paleta de etiquetas

- Plazos: `colors.deadlineUrgent/Soon/Weeks/Months/Long` (+ `*Subtle` para el fondo). Los usa
  `utils/deadlineUtils.ts`.
- La paleta de etiquetas **no es un token del tema**: es un dato que se guarda en el backend como hex.
  Úsala desde `TASK_COLOR_PALETTE` y `DEFAULT_TASK_COLOR` en `constants/theme.ts`; no la copies.

### Antes de terminar una tarea con estilos

- Corre `npm run lint:styles` en `mobile/`. Revisa solo las líneas que cambiaste respecto a `HEAD`:
  **no debe haber avisos nuevos**. `npm run lint:styles -- --all` muestra toda la deuda existente
  (no la arregles de paso si la tarea no lo pide).
- Revisa claro y oscuro (Ajustes → tema).
- Revisa web (`npm run web`) y al menos un nativo (iOS o Android).
- Borra cualquier script auxiliar (`.py`, `.sh`, `.js`) que hayas creado para editar archivos.
