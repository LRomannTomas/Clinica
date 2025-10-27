# 🏥 Clínica Online

Aplicación web desarrollada en **Angular + Supabase**, que permite la gestión integral de una clínica médica, incluyendo registro de usuarios, manejo de turnos, control de disponibilidad de especialistas, carga de historias clínicas, estadísticas visuales y un sistema de acceso segmentado por rol (**Administrador**, **Especialista**, **Paciente**).

---

## 🚀 Tecnologías utilizadas

- **Angular 17+** → componentes standalone, formularios reactivos, pipes, directivas y animaciones modernas.  
- **Supabase** → PostgreSQL, autenticación, storage de imágenes, triggers y políticas RLS seguras.  
- **SCSS modular** → estilos consistentes con diseño médico, moderno y responsive.  
- **Google reCAPTCHA v2** → validación antispam durante el registro.  
- **Chart.js + jsPDF + XLSX** → visualización y exportación de estadísticas administrativas.  
- **jsPDF-AutoTable** → generación profesional de informes clínicos en PDF.  
- **ToastService personalizado** → notificaciones visuales (éxito, error, información).  

---

## 👥 Roles y funcionalidades

| Rol | Funcionalidades principales |
|-----|------------------------------|
| **Administrador** | Gestiona usuarios, aprueba especialistas, visualiza estadísticas, controla turnos y accede a todas las historias clínicas. |
| **Especialista** | Define disponibilidad horaria, atiende pacientes, completa historias clínicas y visualiza reseñas de atenciones. |
| **Paciente** | Solicita turnos, deja evaluaciones, visualiza y descarga sus historias clínicas en PDF. |

---

## 🧭 Navegación general

La aplicación cuenta con un **encabezado dinámico (`HeaderPropio`)** que se adapta al rol del usuario logueado, mostrando solo las secciones permitidas.

| Ruta | Descripción | Acceso |
|------|--------------|--------|
| `/login` | Inicio de sesión. | Todos |
| `/registro` | Registro con reCAPTCHA. | Todos |
| `/mi-perfil` | Configuración horaria. | Especialista |
| `/solicitar-turno` | Solicitud de turnos guiada. | Paciente |
| `/turnos-admin` | Gestión completa de turnos. | Administrador |
| `/usuarios` | Aprobación y gestión de usuarios. | Administrador |
| `/historia-clinica` | Visualización y descarga del historial. | Paciente |
| `/historia-clinica-especialista` | Lista de pacientes atendidos. | Especialista |
| `/historia-clinica-admin` | Consulta global de historias. | Administrador |
| `/estadisticas-admin` | Panel de estadísticas interactivas con exportación a PDF y Excel. | Administrador |

---

## 🖥️ Pantallas principales

### 🔐 Login
Pantalla inicial para autenticarse en el sistema.  
![Pantalla de Login](./src/assets/login.jpeg)


### 🧾 Registro
Permite elegir el tipo de usuario (**Paciente** o **Especialista**).  
- Formulario validado con **reCAPTCHA v2**.  
- Campos específicos según el tipo de usuario.  
- Subida de imágenes (DNI o perfil).  
![Pantalla de Registro](./src/assets/registro_1.jpeg)
![Pantalla de Registro](./src/assets/registro_2.jpeg)
![Pantalla de Registro](./src/assets/registro_3.jpeg)
![Pantalla de Registro](./src/assets/captcha.jpeg)

### 👨‍⚕️ Mi Perfil (Especialista)
Configuración de horarios de atención por especialidad, día y hora.  

![Pantalla de Especialista](./src/assets/mis-turnos-especialista.jpeg)

### 📅 Solicitar Turno
Flujo paso a paso para que el paciente seleccione especialidad, especialista, fecha y horario disponible.  

### 🧑‍💼 Usuarios (Administrador)
Gestión de usuarios registrados con posibilidad de aprobar o eliminar especialistas.  
![Pantalla de Usuarios](./src/assets/usuarios-admin.jpeg)

### 📊 Estadísticas Administrativas
Gráficos interactivos para el administrador generados con **Chart.js**:

- Turnos por Especialidad  
- Turnos por Día  
- Turnos Solicitados / Realizados (últimos 30 días)  
- Log de Ingresos al Sistema  

Incluye exportación a PDF y Excel.  
![Pantalla de Estadisticas](./src/assets/estadisticas-admin.jpeg)

---

## 🧩 Pipes implementados

| Pipe | Descripción | Uso |
|------|--------------|-----|
| `NombreCompletoPipe` | Devuelve `Apellido, Nombre` o `Nombre Apellido` evitando valores vacíos. | En listados de usuarios e historias clínicas. |
| `DniPipe` | Formatea el número de DNI con puntos (`12345678` → `12.345.678`). | En vistas de usuario y formularios. |
| `EmptyPipe` | Reemplaza valores nulos o vacíos por un texto predeterminado (`—`, `Sin dato`, etc.). | En historias clínicas y datos opcionales. |

---

## ⚙️ Directivas personalizadas

| Directiva | Función | Aplicación |
|------------|----------|-------------|
| `BotonColorDirective` | Cambia dinámicamente el color y estilo de botones según su tipo (`ver`, `cancelar`, `motivo`, etc.). | Botones de acción en paneles y modales. |
| `OnlyNumberDirective` | Restringe campos de entrada para aceptar solo números. | Campos `edad`, `dni`, etc. |
| `AutoFocusDirective` | Aplica foco automático al primer campo visible del formulario. | Formularios de registro y búsqueda. |

---

## 🩺 Historia Clínica

Sistema completo de registro médico implementado para **especialistas, pacientes y administradores**.

- Datos fijos: altura, peso, temperatura y presión.  
- Campos dinámicos (`extras`) definidos por el especialista.  
- Visualización en modales estéticos y descargable en PDF.

![Pantalla de Historia Clinica](./src/assets/historia-clinica-paciente.jpeg)

### 📄 Exportación PDF
Generado con **jsPDF + AutoTable**:
- Logo institucional y fecha de emisión.  
- Tablas con formato centrado y colores institucionales.  
- Separadores visuales entre registros.

---

## 💬 Evaluaciones y reseñas

- El paciente puede dejar una reseña luego de su atención.  
- El especialista puede leer la reseña desde su panel.  
- Muestra puntuación, satisfacción y comentarios.  

---

## 🎨 Diseño y estética general

- Paleta profesional:  
  - 🟩 Verde azulado: `#2a9d8f`  
  - 🟦 Azul oscuro: `#264653`  
  - 🟥 Rojo coral: `#e76f51`
- Estilo moderno, limpio y responsive.  
- Animaciones suaves (`fadeSlide`, `zoomInOut`).  
- Botones flotantes para exportaciones (PDF, Excel).  


---

## 🧭 Flujo general del sistema

1. Registro con reCAPTCHA.  
2. Aprobación de especialista por el administrador.  
3. Solicitud de turno del paciente.  
4. Atención por parte del especialista.  
5. Generación de historia clínica y reseña.  
6. Exportación de datos e informes.  


---

## ⚙️ Ejecución local

```bash
# 1️⃣ Clonar el repositorio
git clone https://github.com/LRomannTomas/Clinica.git
cd Clinica

# 2️⃣ Instalar dependencias
npm install

# 3️⃣ Configurar entorno Supabase (src/environments)
#    - url
#    - anon key

# 4️⃣ Ejecutar en desarrollo
ng serve
