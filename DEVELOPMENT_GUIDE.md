# AyeTasks — Guía de Desarrollo y Flujo Nativo

Esta guía describe el flujo de trabajo para compilar, probar y desarrollar la aplicación **AyeTasks** en **Android Studio**, **Xcode** y dispositivos físicos/simuladores utilizando **Expo Development Builds** y el pipeline automatizado `build.sh`.

---

## 📱 Concepto: Development Build vs Expo Go

AyeTasks utiliza **Continuous Native Generation (CNG)** con `expo-dev-client`:
- **Identificador de paquete:** `com.ayeapps.ayetasks`
- **Esquema Deep Linking:** `ayetasks://`
- Las carpetas nativas `/android` y `/ios` se generan automáticamente desde la configuración central en `app.json`.
- A diferencia de Expo Go de Play Store, un **Development Build** es tu propio runtime nativo personalizado, 100% compatible con cualquier versión de SDK y módulo nativo.

---

## 🚀 Flujo de Trabajo desde Cero (Tras encender tu Mac)

### Opción A: Vía IDEs (Android Studio / Xcode)

Este flujo es ideal si deseas depurar con las herramientas visuales de Android Studio o Xcode:

1. **Generar/Actualizar y abrir el IDE:**
   En la raíz del proyecto, ejecuta:
   ```bash
   ./build.sh
   ```
   - Selecciona **`1`** para abrir en **Android Studio** (`android/`).
   - Selecciona **`2`** para abrir en **Xcode** (`ios/AyeTasks.xcworkspace`).
   - Selecciona **`3`** para abrir **ambos**.

2. **Iniciar Metro Bundler (Servidor de desarrollo):**
   En una pestaña de tu terminal, deja corriendo:
   ```bash
   ./build.sh start
   ```
   *(O alternativamente: `npm start`)*.

3. **Compilar y Correr:**
   - **En Android Studio:** Conecta tu dispositivo por USB o inicia un emulador y presiona el botón **▶ Run** (`Ctrl + R`).
   - **En Xcode:** Selecciona tu simulador o iPhone y presiona el botón **▶ Run** (`⌘ + R`).

---

### Opción B: Modo Rápido (100% por Terminal)

Si no necesitas abrir las interfaces pesadas de los IDEs y solo quieres compilar y lanzar la app directamente:

* **Para Android:**
  ```bash
  ./build.sh run-android
  ```
  *Compila el APK en segundo plano, lo instala en tu emulador/dispositivo conectado e inicia Metro.*

* **Para iOS:**
  ```bash
  ./build.sh run-ios
  ```
  *Compila el proyecto iOS, lo abre en el Simulador de iPhone e inicia Metro.*

---

## 🛠️ Referencia de Comandos de `build.sh`

El script `./build.sh` incluye tanto un menú interactivo como accesos directos por consola:

| Comando | Descripción |
| :--- | :--- |
| `./build.sh` | Despliega el menú interactivo con todas las opciones. |
| `./build.sh android` | Verifica dependencias, ejecuta `prebuild` de Android y abre Android Studio. |
| `./build.sh ios` | Verifica dependencias, ejecuta `prebuild`, instala CocoaPods y abre Xcode. |
| `./build.sh all` | Genera y sincroniza ambos proyectos nativos (Android + iOS). |
| `./build.sh run-android` | Compila y ejecuta directamente en Android (`npx expo run:android`). |
| `./build.sh run-ios` | Compila y ejecuta directamente en iOS (`npx expo run:ios`). |
| `./build.sh start` | Inicia Metro Bundler en modo Development Client (`--dev-client`). |
| `./build.sh clean` | Borra las carpetas `/android` e `/ios` y las regenera limpiamente desde cero. |

---

## ⚡ Rutina Diaria de Programación (Fast Refresh)

1. **Edición en tiempo real:**
   - Una vez que la app está abierta en tu teléfono o simulador, **no necesitas volver a compilar**.
   - Cada vez que guardas cambios en TypeScript/React Native (`App.tsx`, componentes, lógica en `src/`), la app se actualiza instantáneamente en pantalla en milisegundos gracias a **Fast Refresh**.

2. **Si cierras la app en tu teléfono:**
   - La app instalada permanece en tu pantalla de inicio con el ícono de **AyeTasks**.
   - Para reanudar: Asegúrate de tener `./build.sh start` corriendo en tu Mac y abre la app tocando su ícono en el teléfono.

3. **¿Cuándo SÍ es necesario volver a compilar con `./build.sh`?**
   - Cuando instales una nueva librería nativa (`npm install ...` o `npx expo install ...`).
   - Cuando agregues permisos nativos, plugins o cambies nombres/íconos en `app.json`.

---

## 🔧 Solución de Problemas Frecuentes

### Puerto 8081 ocupado (`Port 8081 is running this app in another window`)
Si cerraste una terminal y el proceso de Metro quedó activo en segundo plano:
```bash
npx kill-port 8081
```

### Limpieza profunda de proyectos nativos
Si alguna actualización de dependencias causa conflictos de compilación en Gradle o CocoaPods:
```bash
./build.sh clean
```

### Limpiar caché de la app en Android por terminal (ADB)
```bash
adb shell cmd package clear-cache com.ayeapps.ayetasks
```
