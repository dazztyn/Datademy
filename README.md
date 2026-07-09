<h1 align="center">Datademy</h1>
<h3 align="center">Automatización de recopilación, procesamiento y generación de informes A+S</h3>

<p align="center">
  <strong>Por</strong> Pablo Jorquera · Vicente Ruiz · Ien Zavala
</p>

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black">
  <img alt="Expo" src="https://img.shields.io/badge/Mobile-Expo%20%2F%20React%20Native-000020?logo=expo&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/DB-MongoDB-47A248?logo=mongodb&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Cola-Redis%20%2B%20Bull-DC382D?logo=redis&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?logo=docker&logoColor=white">
</p>

---

## Descripción

**Datademy** es una plataforma de software diseñada para **automatizar los procesos manuales en la evaluación de proyectos A+S (Aprendizaje y Servicio)** de la **Universidad Católica del Norte, sede Coquimbo**.

El sistema elimina la carga operativa asociada a la gestión de encuestas masivas, centraliza los datos y genera reportes estadísticos automatizados en tiempo real, mediante integraciones avanzadas con el ecosistema de **Google Workspace**.

### El problema

Actualmente, generar un informe de A+S es un proceso manual que puede tomar de **4 a 5 horas por informe**, e implica:

- Reunir datos y traspasarlos manualmente a planillas de Excel.
- Recopilar y tabular respuestas y preguntas a mano.
- Analizar los datos para redactar conclusiones.
- Crear gráficos, tomar capturas de pantalla y pegarlas en un documento.
- Calcular manualmente la calidad de los instrumentos (Alfa de Cronbach).

Con múltiples carreras, asignaturas y socios comunitarios, este flujo de trabajo manual **no es sostenible** y es propenso a errores humanos.

### La solución

Datademy conecta directamente con **Google Forms, Google Drive y Google Docs** para automatizar todo el proceso:

- **Recopila** automáticamente las respuestas asociadas a los formularios de Google.
- **Genera gráficos y métricas** relevantes (comparativas por carrera, sede, etc.) sin intervención manual.
- **Calcula el Alfa de Cronbach** para evaluar la calidad y confiabilidad de cada instrumento.
- Permite **visualizar respuestas individuales** y aplicar filtros según lo que el usuario necesite.
- Cuenta con una pantalla dedicada a la **generación de informes**: el usuario completa los datos que la app no puede obtener automáticamente, selecciona los filtros apropiados y genera el informe final en cuestión de segundos.
- Incluye una **app móvil** para visualizar y hacer seguimiento de los datos desde cualquier lugar.

---

## Características principales

- **Orquestación de formularios:** clonación y vinculación automatizada de plantillas de Google Forms para cada proceso A+S.
- **Procesamiento en segundo plano:** uso de colas (Bull + Redis) para procesar altos volúmenes de datos sin bloquear la interfaz.
- **Generación de informes automatizados:** inyección dinámica de gráficos y métricas (NPS, Alfa de Cronbach, demográficos, comparativas) directamente en plantillas de Google Docs.
- **Actualización reactiva:** eventos en tiempo real (Server-Sent Events) para reflejar el estado de las tareas de fondo, como la generación de un informe, sin necesidad de recargar la página.
- **Ecosistema multiplataforma:** arquitectura dividida en Frontend web, Backend (API) y Aplicación móvil.

---

## Arquitectura del proyecto

Este es un **monorepo** compuesto por tres aplicaciones independientes:

```
dazztyn-datademy/
├── backend/          # API REST (NestJS)
├── datademy/         # Aplicación web (React + Vite)
├── datademy-mobile/  # Aplicación móvil (Expo / React Native)
├── docker-compose.yml
└── docker-compose.prod.yml
```

| Componente | Rol |
|---|---|
| **backend** | API REST que orquesta la autenticación con Google, la integración con Google Forms/Drive/Docs, el procesamiento estadístico y la generación de informes. |
| **datademy** | Panel web donde el socio/a de A+S visualiza datos, métricas y genera informes. |
| **datademy-mobile** | App móvil para consultar y hacer seguimiento de los datos desde el celular. |

---

## Stack tecnológico

### Backend (`/backend`)
- **[NestJS](https://nestjs.com/)** (TypeScript) sobre Node.js
- **MongoDB** + **Mongoose** como base de datos
- **Redis** + **Bull** para procesamiento asíncrono (cola de trabajos, workers)
- **Passport** con estrategias **Google OAuth2.0** y **JWT** para autenticación
- **Google APIs** (`googleapis`) para integración con Forms, Drive y Docs
- **Chart.js** para generación de gráficos en los informes
- **Helmet**, **class-validator** y **Throttler** para seguridad y validación
- **Jest** para pruebas unitarias y e2e

### Frontend web (`/datademy`)
- **React 19** + **Vite**
- **TypeScript**
- **React Router**
- **Tailwind CSS**
- **Chart.js / react-chartjs-2** y **Recharts** para visualización de datos
- **Vitest** + **Testing Library** para pruebas unitarias, **Playwright** para pruebas e2e

### App móvil (`/datademy-mobile`)
- **Expo** + **React Native**
- **Expo Router** (ruteo basado en archivos)
- **NativeWind** (Tailwind para React Native)
- **Google Sign-In** para autenticación
- **react-native-gifted-charts** para visualización de datos

### Infraestructura
- **Docker** y **Docker Compose** para orquestar backend, frontend, MongoDB y Redis
- Configuraciones separadas para desarrollo (`docker-compose.yml`) y producción (`docker-compose.prod.yml`)

### Integraciones (Google Cloud)
- **Google Forms API** — lectura de formularios y respuestas
- **Google Docs API** — generación de informes
- **Google Drive API** — almacenamiento y organización de archivos
- **Google Picker API** — selección de archivos de Drive desde la interfaz web

---

## Detalle de funcionalidades

- **Autenticación con Google OAuth 2.0** (con roles de administrador).
- **Gestión de procesos y formularios**: creación, vinculación y configuración de procesos A+S asociados a formularios de Google.
- **Estadísticas automáticas**: cálculo de métricas demográficas, NPS, satisfacción, rankings y comparativas entre carreras/sedes.
- **Cálculo del Alfa de Cronbach** para medir la fiabilidad de los instrumentos.
- **Generación de informes** en Google Docs con gráficos incrustados automáticamente, a partir de datos completados por el usuario y filtros seleccionados.
- **Panel de administración** para la gestión de usuarios y plantillas.
- **Seguimiento desde la app móvil**: visualización de datos globales, detalles, respuestas de estudiantes y de socios.

---

## Configuración y pre-requisitos

Para ejecutar este proyecto en tu entorno local o servidor, necesitas tener instalado:

- [Docker](https://www.docker.com/) y Docker Compose
- [Node.js](https://nodejs.org/) (v18 o superior), si se ejecutará algún componente sin Docker
- Un proyecto configurado en [Google Cloud Console](https://console.cloud.google.com/) con las APIs mencionadas habilitadas y credenciales de OAuth 2.0

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd dazztyn-datademy
```

### 2. Variables de entorno

Debes crear los archivos `.env` correspondientes en cada directorio de la aplicación. Como mínimo, el backend necesita un archivo `backend/.env` (o `backend/.env.prod` para producción) con los siguientes parámetros:

**Backend (`/backend/.env`)**
```env
MONGODB_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_PROJECT_ID=
WEBHOOK_SECRET=
REDIS_URL=
JWT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=
PORT=
```

> Los scopes de Google solicitados por la app incluyen `email`, `profile`, `drive` y `documents`, necesarios para leer los formularios/respuestas y generar los informes en Google Docs. `WEBHOOK_SECRET` protege el endpoint que recibe las notificaciones de nuevas respuestas desde Google.

### 3. Despliegue con Docker

El proyecto está completamente contenerizado para asegurar consistencia entre el entorno de desarrollo y producción. Para levantar toda la infraestructura (base de datos, caché, backend y frontend web), ejecuta en la raíz del proyecto:

```bash
docker-compose up -d --build
```

Esto levantará los siguientes servicios:

- **Frontend Web:** `http://localhost:8080/`
- **Backend API:** `http://localhost:3000/`
- **MongoDB:** puerto `27017`
- **Redis:** puerto `6379`

> Para entornos de producción en servidores dedicados, utiliza el archivo orquestador específico:
> ```bash
> docker-compose -f docker-compose.prod.yml up -d --build
> ```

### 4. Ejecución manual (sin Docker)

**Backend**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend web**
```bash
cd datademy
npm install
npm run dev
```

**App móvil**
```bash
cd datademy-mobile
npm install
npx expo start
```

---

## Pruebas

```bash
# Backend (unitarias y e2e)
cd backend
npm run test
npm run test:e2e

# Frontend web (unitarias)
cd datademy
npm run test

# Frontend web (end-to-end con Playwright)
npm run test:e2e
```

---

## Estructura resumida del backend

```
backend/src/
├── auth/            # Autenticación (Google OAuth2.0 + JWT)
├── admin/           # Gestión de administradores
├── usuarios/        # Gestión de usuarios
├── google/          # Integración con Google Drive y Google Forms
├── formularios/      # Procesos, plantillas y configuraciones de formularios
├── estadisticas/     # Cálculo de métricas (NPS, Cronbach, demográficos, comparativas)
└── reportes/         # Generación de informes en Google Docs
```

## Estructura resumida del frontend web

```
datademy/src/
├── components/      # Componentes reutilizables (modales, tablas, gráficos, sidebar)
├── context/         # Contextos de Auth, Proceso, Informe y Tema
├── hooks/           # Hooks personalizados (métricas, formularios, filtros, etc.)
├── pages/           # Vistas (Login, Dashboard, Panel Admin, secciones de informes)
└── services/        # Llamadas a la API del backend
```

## Estructura resumida de la app móvil

```
datademy-mobile/
├── app/             # Rutas (file-based routing con Expo Router)
├── components/      # Componentes de UI y gráficos
├── context/         # Contexto de autenticación
├── hooks/           # Hooks de estadísticas, formularios, etc.
└── services/        # Llamadas a la API del backend
```

---

## Autores y créditos

Este sistema fue desarrollado para agilizar las operaciones de proyectos A+S.

**Socia comunitaria**
- Margareth Cleveland

**Equipo de desarrollo**
- Vicente Ruiz
- Ien Zavala
- Pablo Jorquera

Estudiantes de Ingeniería Civil en Computación e Informática, Universidad Católica del Norte (UCN), sede Coquimbo.
