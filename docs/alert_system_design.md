# Sistema de Alertas TAICare — Documento de Diseño

## Resumen

TAICare monitoriza la actividad diaria de pacientes mayores mediante dispositivos inteligentes (enchufes). El sistema de alertas notifica a cuidadores cuando se detecta un comportamiento inesperado o potencialmente peligroso. Cada cuidador puede personalizar qué alertas recibe y con qué severidad.

---

## Tipos de Alerta

### 1. Rutinas

| Código | Nombre | Descripción | Severidad por defecto |
|---|---|---|---|
| `ROUTINE_MISSED` | Rutina no completada | El paciente no realizó una rutina dentro de su ventana horaria | 🔴 **Alta** |

> Las variantes `ROUTINE_LATE` y `ROUTINE_INCOMPLETE` se reservan para una futura funcionalidad de **Análisis de Actividad del Paciente** con gráficos y tendencias.

---

### 2. Actividad en Horas Anómalas

Configurables por paciente mediante un rango de "horas de vigilia" y una "franja nocturna".

| Código | Nombre | Descripción | Severidad por defecto |
|---|---|---|---|
| `UNUSUAL_HOUR_ACTIVITY` | Actividad fuera de horario | Dispositivo activo fuera del rango horario configurado del paciente | 🔴 **Alta** |
| `NIGHT_ACTIVITY` | Actividad nocturna | Actividad intensa detectada durante la franja nocturna definida | 🟡 **Media** |

---

### 3. Datos Sospechosos

| Código | Nombre | Descripción | Severidad por defecto |
|---|---|---|---|
| `DATA_GAP` | Sin datos del dispositivo | El dispositivo no envió datos durante más de X minutos/horas | 🔴 **Alta** |
| `DATA_SPIKE` | Consumo anómalo alto | Consumo eléctrico notablemente superior a la media del paciente | 🟡 **Media** |
| `ERRATIC_BEHAVIOR` | Comportamiento errático | Ciclos de encendido/apagado repetidos en menos de X minutos | 🔴 **Alta** |

---

### 4. Inactividad

Dos alertas distintas, ambas críticas: una ligada a una rutina concreta, la otra a la ausencia global durante las horas de vigilia.

| Código | Nombre | Descripción | Severidad por defecto |
|---|---|---|---|
| `NO_ACTIVITY` | Sin actividad en rutina | Ningún dispositivo activo durante la ventana de una rutina | 🔴 **Alta** |
| `PROLONGED_INACTIVITY` | Inactividad prolongada | Ningún dispositivo activo durante un período largo en horas de vigilia (ej. 12h) | 🔴 **Alta** |

---

### 5. Dispositivo

| Código | Nombre | Descripción | Severidad por defecto |
|---|---|---|---|
| `DEVICE_ISSUE` | Problema con dispositivo | Dispositivo offline, sin respuesta o con lecturas inválidas | 🟡 **Media** |

---

## Resumen de Códigos

```
ROUTINE_MISSED
UNUSUAL_HOUR_ACTIVITY · NIGHT_ACTIVITY
DATA_GAP · DATA_SPIKE · ERRATIC_BEHAVIOR
NO_ACTIVITY · PROLONGED_INACTIVITY
DEVICE_ISSUE
```

---

## Configuración de Alertas por Cuidador

### Modelo de datos (`User.js` — cuidador)

Cada cuidador almacena un mapa de preferencias por tipo de alerta:

```json
"alert_preferences": {
  "ROUTINE_MISSED":          { "enabled": true,  "severity": "HIGH" },
  "UNUSUAL_HOUR_ACTIVITY":   { "enabled": true,  "severity": "HIGH" },
  "NIGHT_ACTIVITY":          { "enabled": true,  "severity": "MEDIUM" },
  "DATA_GAP":                { "enabled": true,  "severity": "HIGH" },
  "DATA_SPIKE":              { "enabled": true,  "severity": "MEDIUM" },
  "ERRATIC_BEHAVIOR":        { "enabled": true,  "severity": "HIGH" },
  "NO_ACTIVITY":             { "enabled": true,  "severity": "HIGH" },
  "PROLONGED_INACTIVITY":    { "enabled": true,  "severity": "HIGH" },
  "DEVICE_ISSUE":            { "enabled": true,  "severity": "MEDIUM" }
}
```

Si el campo no existe (registro antiguo o "Recordar más tarde"), el sistema usa los valores por defecto mostrados en la tabla.

---

## Flujo de Onboarding — Configuración Inicial de Alertas

### Cuándo aparece

Inmediatamente después del primer login tras el registro, si `alert_preferences_configured: false`.

### Pantalla de configuración (`AlertSetup`)

- Listado de los 9 tipos de alerta, agrupados por categoría.
- Por cada tipo:
  - ⬛ Toggle **Activada / Desactivada**
  - 🎛️ Selector de **Severidad**: Alta · Media · Baja
- Botón **"Guardar configuración"** → guarda preferencias, marca `alert_preferences_configured: true` y redirige al dashboard.
- Botón **"Recordar más tarde"** → aplica los valores por defecto, no marca el flag, y redirige al dashboard. El aviso reaparecerá en el siguiente login hasta que el usuario configure explícitamente.

### Acceso posterior

La configuración siempre estará disponible desde la página **Configuración** (`/settings`), accesible desde el sidebar o el menú de perfil.

---

## Notas de Implementación

| Componente | Cambio necesario |
|---|---|
| `User.js` (Backend) | Añadir campos `alert_preferences` (Map) y `alert_preferences_configured` (Boolean, default false) |
| `alertEngine.js` | Al generar alerta, consultar `alert_preferences` del cuidador para aplicar severidad personalizada o suprimir el tipo |
| `constants/index.js` | Añadir `ALERT_TYPES` con los 9 códigos y sus defaults |
| Login / `AuthContext` | Tras login, comprobar `alert_preferences_configured` y redirigir a `/alert-setup` si es false |
| `AlertSetup.jsx` (nuevo) | Página de configuración inicial (onboarding) |
| `Settings.jsx` (nuevo) | Página de configuración permanente, accesible desde sidebar |
| `userController.js` | Endpoint `PUT /users/:id` ya existente — solo añadir `alert_preferences` al whitelist de campos editables |
