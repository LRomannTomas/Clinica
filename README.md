# 🏥 Clínica Online

Aplicación web desarrollada en **Angular + Supabase**, que permite la gestión integral de una clínica médica, incluyendo registro de usuarios, manejo de turnos, control de disponibilidad de especialistas y un sistema de acceso según perfil (Administrador, Especialista, Paciente).

---

## 🚀 Tecnologías utilizadas

- **Angular 17+** (componentes standalone, formularios reactivos, modales y navegación)
- **Supabase** (base de datos PostgreSQL + autenticación + almacenamiento de imágenes)
- **SCSS** (estilos personalizados con una estética moderna y coherente)
- **Google reCAPTCHA** (validación antispam en el registro)
- **ToastService personalizado** (notificaciones de éxito o error)

---

## 👥 Roles y funcionalidades

| Rol | Funcionalidades principales |
|-----|------------------------------|
| **Administrador** | Gestiona usuarios (alta, aprobación de especialistas) y turnos. |
| **Especialista** | Administra su disponibilidad horaria y visualiza los turnos asignados. |
| **Paciente** | Se registra con su obra social y puede solicitar turnos. |

---

## 🧭 Navegación general

La aplicación cuenta con un encabezado común (`HeaderPropio` / `Navbar`) que se adapta según el tipo de usuario logueado y permite acceder a las secciones disponibles para su perfil.

### 🔹 Rutas principales

| Ruta | Descripción | Acceso |
|------|--------------|--------|
| `/login` | Pantalla de inicio de sesión de usuarios registrados. | Todos |
| `/registro` | Registro de usuarios nuevos (paciente o especialista) con verificación de captcha. | Todos |
| `/mi-perfil` | Panel de especialista para gestionar horarios. | Especialistas |
| `/solicitar-turno` | Flujo paso a paso para pedir un turno. | Pacientes / Admin |
| `/turnos-admin` | Listado y gestión completa de turnos (filtrar, cancelar, justificar). | Administrador |
| `/usuarios` | Listado de usuarios registrados con control de aprobación. | Administrador |

---

## 🖥️ Pantallas y secciones

### 🩺 **Pantalla de Registro**
- Permite elegir el tipo de usuario: **Paciente** o **Especialista**.
- El registro de paciente requiere:
  - Nombre, apellido, edad, DNI, obra social, email y contraseña.
  - Subida de **dos imágenes** (frente y dorso del DNI o similar).
- El registro de especialista requiere:
  - Datos personales, una foto de perfil y la selección de una o más especialidades.
  - En caso de que no esté listada, puede agregar una “Otra especialidad”.
- Antes de confirmar el registro, se muestra una **verificación Captcha**.
- Los especialistas quedan **pendientes de aprobación** por parte del administrador.

---

### 👨‍⚕️ **Mi Perfil (Especialista)**
- Permite agregar o modificar la **disponibilidad horaria** del especialista.
- Se muestran los horarios guardados (día, hora de inicio y fin).
- Cada horario puede **activarse o desactivarse**.
- Todo se gestiona paso a paso:
  1. Seleccionar especialidad.
  2. Elegir día de la semana.
  3. Definir rango horario.
  4. Confirmar y guardar.

---

### 📅 **Solicitar Turno**
- Flujo visual paso a paso:
  1. Seleccionar especialidad.
  2. Elegir especialista (filtrado por especialidad).
  3. Escoger fecha (limitada a los próximos 15 días, calendario en español).
  4. Seleccionar horario disponible.
  5. Confirmar turno.
- Si accede un **Administrador**, puede elegir al paciente manualmente.
- Se conecta dinámicamente con la tabla `horarios_especialistas` en Supabase.

---

### 🧾 **Turnos (Administrador)**
- Listado completo de turnos registrados.
- Permite **filtrar por especialidad o especialista**.
- Cada turno muestra:
  - Paciente, especialista, fecha, hora y estado.
- Se puede **cancelar un turno** con una justificación visual (mediante modal elegante).
- No se pueden cancelar turnos con estado **Aceptado**, **Realizado** o **Rechazado**.

---

### 👩‍💻 **Usuarios (Administrador)**
- Muestra todos los usuarios registrados.
- Los especialistas aparecen inicialmente como “Pendientes de aprobación”.
- El administrador puede aprobarlos o rechazarlos.
- Acceso directo a sus datos e imágenes cargadas.

---

## 🖼️ Diseño y estética

- Paleta de colores coherente con el entorno médico:
  - Verde azulado: `#2a9d8f`
  - Azul oscuro: `#264653`
  - Rojo coral: `#e76f51`
- Estilo **centrado, limpio y moderno** con botones grandes, bordes redondeados y animaciones suaves.
- Ventanas modales (como la del captcha) con fondo semitransparente y diseño responsive.

---

## 🔐 Seguridad

- Autenticación de usuarios a través de **Supabase Auth** (correo y contraseña).
- Política de acceso según rol.
- Verificación **reCAPTCHA** en el registro para evitar registros automáticos.
- Las imágenes se almacenan en **buckets de Supabase Storage**.
- Validaciones y restricciones en formularios (campos obligatorios, longitud mínima, etc.).

---

## 🧩 Estructura de Supabase

### Tablas principales:
- **usuarios:** datos generales (id, nombre, apellido, edad, dni, email, perfil, aprobado).
- **pacientes:** información médica (obra social, fotos del DNI).
- **especialistas:** especialidades, foto de perfil, disponibilidad.
- **horarios_especialistas:** día, hora_inicio, hora_fin, especialidad, estado.
- **turnos:** relación entre paciente, especialista, fecha, hora y estado.

---

## 🧭 Flujo general del sistema

1. El usuario se registra con captcha.  
2. Si es especialista, queda pendiente de aprobación.  
3. Si es paciente, puede solicitar turnos inmediatamente.  
4. El especialista define sus horarios en “Mi Perfil”.  
5. El administrador gestiona usuarios y turnos.

---

## ⚙️ Ejecución local

1. Clonar el repositorio  
   ```bash
   git clone https://github.com/LRomannTomas/clinica.git
   cd clinica-online
