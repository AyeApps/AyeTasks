# Trampas conocidas

Cosas en el repo que parecen un patrón reutilizable a copiar, pero no lo
son. Verificadas por lectura directa de código, no por suposición — si el
archivo referenciado cambió, vuelve a verificar antes de confiar en esto.

## `THEME.colors` es siempre el tema oscuro

`THEME.colors` en `constants/theme.ts` está fijado a `DARK_THEME`. Cualquier
componente que lo use se ve con colores oscuros también en modo claro. Los
colores del tema activo salen de `useTheme().colors` (que lee
`useUIStore.themeColors`). El guardián (`npm run lint:styles`) lo marca.

## `AuthModal.tsx` es código muerto con colores fijos

`components/auth/AuthModal.tsx` usa `THEME.colors` en 28 líneas y **no se
importa en ningún lado** — verificado con
`grep -rn "AuthModal" mobile/src mobile/App.tsx` (2026-10-09): solo aparece
en su propia definición. La pantalla de login real es `AuthScreen.tsx`. No lo
copies como plantilla.

## `THEME.fonts.mono` es `'Courier'`, que no existe en Android

`THEME.fonts.mono = 'Courier'` (usado ~200 veces). En iOS y web existe; en
Android no hay una fuente llamada así, y React Native cae a la fuente por
defecto (no monoespaciada). `LandingPage.tsx` lo esquiva a mano con
`Platform.OS === 'ios' ? 'Courier' : 'monospace'`, que es justo lo que las
reglas prohíben repetir. **Pendiente de verificar en dispositivo Android.**
Si se confirma, el arreglo va en un solo lugar: `THEME.fonts.mono` con
`Platform.select({ ios: 'Courier', android: 'monospace', default: 'Courier' })`
— no en cada componente.

## `StyleSheet.create` no conoce el tema

Un color de `colors` puesto dentro de `StyleSheet.create` (fuera del
componente) no existe en ese scope, y uno de `THEME.colors` queda fijo en
oscuro. Los colores van en línea (`[styles.x, { color: colors.textPrimary }]`);
las medidas sí van en `StyleSheet.create`. Ver regla 4 de `GEMINI.md`.

## `README.md` de la raíz menciona `src/theme.ts`

No existe. Los tokens están en `mobile/src/constants/theme.ts`.
