# 🏥 Clínica Online

Aplicación web desarrollada en **Angular + Supabase**, que permite la gestión integral de una clínica médica, incluyendo registro de usuarios, manejo de turnos, control de disponibilidad de especialistas, carga de historias clínicas y un sistema de acceso segmentado por rol (Administrador, Especialista, Paciente).

---

## 🚀 Tecnologías utilizadas

- **Angular 17+** → componentes standalone, formularios reactivos, pipes, modales y navegación moderna.  
- **Supabase** → PostgreSQL, autenticación, storage de imágenes y políticas RLS seguras.  
- **SCSS modular** → estilos consistentes con diseño médico, moderno y responsive.  
- **Google reCAPTCHA** → validación antispam en el registro.  
- **jsPDF + jsPDF-AutoTable** → generación profesional de informes en PDF (historias clínicas).  
- **ToastService personalizado** → notificaciones visuales (éxito, error, información).  

---

## 👥 Roles y funcionalidades

| Rol | Funcionalidades principales |
|-----|------------------------------|
| **Administrador** | Gestiona usuarios, aprueba especialistas, controla turnos y accede a todas las historias clínicas. |
| **Especialista** | Define disponibilidad horaria, atiende pacientes, completa historias clínicas y visualiza reseñas de atenciones. |
| **Paciente** | Solicita turnos, deja evaluaciones, visualiza y descarga sus historias clínicas en PDF. |

---

## 🧭 Navegación general

La aplicación cuenta con un encabezado dinámico (`HeaderPropio`) que se adapta al rol del usuario logueado y muestra las rutas correspondientes.

| Ruta | Descripción | Acceso |
|------|--------------|--------|
| `/login` | Pantalla de inicio de sesión. | Todos |
| `/registro` | Registro con verificación de reCAPTCHA. | Todos |
| `/mi-perfil` | Configuración de horarios del especialista. | Especialistas |
| `/solicitar-turno` | Solicitud de turnos paso a paso. | Pacientes |
| `/turnos-admin` | Gestión completa de turnos. | Administrador |
| `/usuarios` | Aprobación y gestión de usuarios. | Administrador |
| `/historia-clinica` | Visualización y descarga de historia clínica. | Pacientes |
| `/historia-clinica-especialista` | Lista de pacientes atendidos y sus historias. | Especialistas |
| `/historia-clinica-admin` | Consulta global de historias clínicas. | Administrador |

---

## 🖥️ Pantallas y secciones

### 🩺 **Pantalla de Registro**
- Permite elegir tipo de usuario: **Paciente** o **Especialista**.  
- Registro de **Paciente**:
  - Nombre, apellido, edad, DNI, obra social, email, contraseña.
  - Subida de **dos imágenes** (frente y dorso del DNI).  
- Registro de **Especialista**:
  - Datos personales, foto de perfil, selección de una o varias especialidades.
  - Posibilidad de agregar “Otra especialidad”.  
- Validación con **reCAPTCHA** antes de confirmar.  
- Los especialistas quedan **pendientes de aprobación** por el administrador.  

---

### 👨‍⚕️ **Mi Perfil (Especialista)**
- Configuración de **disponibilidad horaria** (día, hora de inicio y fin).  
- Activación o desactivación de horarios guardados.  
- Gestión paso a paso:
  1. Selección de especialidad.  
  2. Día de la semana.  
  3. Rango horario.  
  4. Confirmación y guardado.  

---

### 📅 **Solicitar Turno**
- Flujo guiado e intuitivo:
  1. Seleccionar especialidad.  
  2. Elegir especialista (filtrado).  
  3. Escoger fecha (15 días hábiles siguientes).  
  4. Seleccionar horario disponible.  
  5. Confirmar turno.  
- El **Administrador** puede seleccionar manualmente al paciente.  
- Integración completa con `horarios_especialistas` en Supabase.  

---

### 🧾 **Turnos (Administrador)**
- Listado general de todos los turnos.  
- **Filtros** por especialidad o especialista.  
- Cada turno muestra:
  - Paciente, especialista, fecha, hora y estado.  
- Posibilidad de **cancelar** turnos con justificación (modal elegante).  
- No se permite cancelar turnos con estado *Aceptado*, *Realizado* o *Rechazado*.  

---

### 👩‍💻 **Usuarios (Administrador)**
- Vista completa de usuarios registrados.  
- Especialistas nuevos aparecen como “Pendientes de aprobación”.  
- Aprobación o rechazo con un clic.  
- Visualización de datos e imágenes cargadas.  

---

## 🩺 **Historia Clínica**

Sistema completo de **registro y visualización médica**, implementado para especialistas, pacientes y administradores.

### 👨‍⚕️ **Vista del Especialista**
- Lista automática de pacientes que haya atendido al menos una vez.  
- Al presionar “Ver historias”, se abre un **modal estético** con:
  - Especialidad, fecha, altura, peso, temperatura y presión.  
  - Datos adicionales cargados durante la atención.  
- Fechas mostradas en **idioma español** y diseño consistente.  

### 🧑‍💼 **Vista del Administrador**
- Acceso total a todas las historias clínicas registradas.  
- **Buscador avanzado** con filtro por nombre, especialidad o valores clínicos.  
- Diseño con tarjetas limpias y legibles.

### 🧍‍♂️ **Vista del Paciente**
- Muestra todas sus atenciones médicas en tarjetas informativas.  
- Cada historia incluye:
  - Datos fijos (altura, peso, temperatura, presión).  
  - Datos dinámicos (extras definidos por el especialista).  
- Botón flotante circular con ícono `pdf.png` que permite **descargar la historia clínica completa en PDF**.

#### 📄 Exportación a PDF
- Implementada con **jsPDF + autoTable**.  
- Incluye:
  - Logo de la clínica.  
  - Título del informe y fecha de emisión.  
  - Tabla centrada con datos médicos y campos adicionales resaltados en color.  
  - Separador visual entre historias.  
- Estilo profesional y centrado, manteniendo armonía visual.

---

## 💬 Evaluaciones y reseñas
- El paciente puede completar una **encuesta** tras su atención:
  - Puntuación, satisfacción, recomendación y comentario.  
- El especialista y el paciente pueden visualizar posteriormente la reseña completa.  
- Mostradas en **modal animado**, con formato estructurado y traducción de fecha al español.  

---

## 🔍 Sistema de búsqueda inteligente
- **Filtro con debounce (500 ms)** para evitar consultas continuas.  
- Permite buscar por:
  - Nombre, especialidad, estado o cualquier dato médico.  
  - Campos dinámicos dentro de las historias clínicas.  
- Disponible para pacientes, especialistas y administradores.

---

## 🎨 Diseño y estética general

- Paleta médica profesional:
  - 🟩 Verde azulado: `#2a9d8f`  
  - 🟦 Azul oscuro: `#264653`  
  - 🟥 Rojo coral: `#e76f51`
- Estilo moderno, limpio y armonioso.  
- Botones circulares flotantes (para PDF y Excel).  
- Animaciones suaves (`fadeSlide`, `zoomInOut`).  
- Totalmente responsive y optimizado para Vercel.

---

## 🧩 Estructura de Supabase (actualizada)

| Tabla | Descripción |
|-------|--------------|
| **usuarios** | Información general de todos los perfiles. |
| **pacientes** | Datos personales y obra social. |
| **especialistas** | Foto, especialidades y disponibilidad. |
| **turnos** | Relación entre paciente, especialista, fecha y estado. |
| **detalles_turno** | Comentarios, evaluaciones y reseñas. |
| **historia_clinica** | Altura, peso, temperatura, presión y extras médicos. |
| **horarios_especialistas** | Disponibilidad y horarios activos. |

---

## 🧭 Flujo general del sistema

1. Registro con reCAPTCHA.  
2. Aprobación de especialista por el administrador.  
3. Paciente solicita turno.  
4. Especialista gestiona su agenda.  
5. Turno finalizado → Historia clínica + evaluación del paciente.  
6. Paciente puede descargar su historial completo en PDF.  

---

## ⚙️ Ejecución local

1. Clonar el repositorio  
   ```bash
   git clone https://github.com/LRomannTomas/clinica.git
   cd clinica-online
