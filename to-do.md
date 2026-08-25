# 📋 AyeTasks — Plan de Trabajo y Lista de Tareas (To-Do)

**Fecha de actualización:** 25 de Agosto, 2026  
**Proyecto:** AyeTasks (iOS & Android)  
**Dominio Oficial API:** `https://api-aytsks.ayeapps.com/api/v1`  
**WebSockets:** `wss://api-aytsks.ayeapps.com/api/v1/ws/sync`  
**Organización:** AyeApps (`ayeapps.services@gmail.com`)

---

## ✅ Completado

### 1. Infraestructura y Backend en Producción
- [x] **Base de Datos:** MongoDB Atlas Cluster (`AyeAppsCluster`) configurado y conectado con usuario de servicio `ayeapps_railway_ayetasks`.
- [x] **Backend FastAPI:** Desplegado en Railway con puerto dinámico, HSTS y optimizaciones de latencia (respuesta en ~0.0003s).
- [x] **Dominio y Red Cloudflare:**
  - Registro y DNS de `ayeapps.com` bajo cuenta empresarial de Cloudflare.
  - Subdominio `api-aytsks.ayeapps.com` con SSL/TLS estricto y proxy activo.
  - Transferencia segura de `fatimaresendiz.com` completada.
- [x] **WebSockets en Tiempo Real:** Canal `/ws/sync` para sincronización bidireccional inmediata de tareas, conexiones y tiempos.

### 2. Autenticación y Cuentas
- [x] **Autenticación Local:** Registro, login, refresh tokens con rotación, borrado seguro de cuentas y recuperación.
- [x] **Google Sign-In:**
  - Client IDs generados para Web, iOS y Android en Google Cloud Console.
  - Validación de tokens criptográficos en el backend con `google-auth`.
  - Botón cyber-brutalist integrado en frontend.
- [x] **Apple Sign-In (Cross-Platform):**
  - Flujo nativo en iOS con Face ID / Touch ID (`expo-apple-authentication`).
  - Flujo web OAuth para Android (`expo-auth-session` / `expo-crypto`).
  - Validación de JWT con llaves públicas oficiales de Apple (`https://appleid.apple.com/auth/keys`).

### 3. App Store Connect & iOS
- [x] **Ficha de la App:** Creada en App Store Connect (`AyeTasks` / `com.ayeapps.ayetasks`).
- [x] **Entitlements:** Capacidad `com.apple.developer.applesignin` inyectada en el proyecto.
- [x] **Exención de Criptografía:** `ITSAppUsesNonExemptEncryption: false` configurado.
- [x] **Primer Build de Producción:** Compilado (`1.0.0 (1)`) y subido con éxito a App Store Connect vía Xcode.

---

## 📌 Pendientes y Próximos Pasos (To-Do)

### 🚀 Fase 1: Pruebas en Vivo (TestFlight & Dispositivos)
- [ ] **TestFlight Internal Testing:**
  - Agregar correo de tester en App Store Connect > TestFlight > Pruebas Internas.
  - Instalar la app en iPhone físico vía TestFlight.
- [ ] **Validación E2E en Dispositivo:**
  - Probar login con Apple (Touch ID / Face ID).
  - Probar login con Google.
  - Probar creación de tareas, conexiones neuronales y temporizador Pomodoro en tiempo real.
  - Probar persistencia y sincronización offline (modo avión).

---

### 📄 Fase 2: Requisitos de Lanzamiento en Tiendas (App Store & Google Play)
- [ ] **Páginas Legales en `ayeapps.com`:**
  - [ ] Crear página de **Política de Privacidad** (`https://ayeapps.com/privacy` o `/ayetasks/privacy`).
  - [ ] Crear página de **Soporte y Términos de Servicio** (`https://ayeapps.com/support`).
- [ ] **Apple Services ID (para Apple Sign-In en Android):**
  - [ ] Registrar `com.ayeapps.ayetasks.auth` en [developer.apple.com](https://developer.apple.com/account/resources/identifiers/add/serviceId).
  - [ ] Vincular con Primary App ID `com.ayeapps.ayetasks`, dominio `ayeapps.com` y return URL `https://api-aytsks.ayeapps.com/api/v1/auth/oauth/apple/callback`.
- [ ] **Activos Gráficos y Metadatos de Tienda:**
  - [ ] Capturas de pantalla oficiales (Screenshots para iPhone de 6.7" y 6.5").
  - [ ] Descripción corta, descripción larga y palabras clave (Keywords SEO/ASO).
  - [ ] Clasificación por edad y cuestionario de contenido en App Store Connect.

---

### 🤖 Fase 3: Android & Google Play Console
- [ ] **Compilación de Android:**
  - [ ] Generar el paquete optimizado de producción **`.aab` (Android App Bundle)** (`cd android && ./gradlew bundleRelease`).
- [ ] **Google Play Console:**
  - [ ] Crear la aplicación en la consola de Google Play bajo la cuenta de AyeApps.
  - [ ] Subir el `.aab` a la pista de **Pruebas Cerradas / Internas**.
  - [ ] Probar inicio de sesión con Google y Apple en dispositivo Android.

---

### ⚙️ Fase 4: Mantenimiento y Organización
- [ ] **Consolidación de Cuentas (Próximo ciclo / corte del 17):**
  - [ ] Centralizar el plan de Railway en la cuenta oficial de `ayeapps.services@gmail.com`.
  - [ ] Sincronizar permisos de colaboradores definitivos en GitHub.
- [ ] **Monitoreo & Backups:**
  - [ ] Configurar alertas de rendimiento y copias de seguridad automáticas en MongoDB Atlas.
