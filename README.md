<h1 align="center"> DATADEMY </h1>

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

Descripción

Datademy es un proyecto desarrollado para la Universidad Católica del Norte, sede Coquimbo, orientado a automatizar todo el ciclo de trabajo de los formularios finales de las experiencias Aprendizaje + Servicio (A+S): desde la recopilación de respuestas de encuestas hasta la generación del informe final, pasando por el procesamiento estadístico y la visualización de datos.

El problema

Actualmente, generar un informe de A+S es un proceso manual que puede tomar de 4 a 5 horas por informe, e implica:


Reunir datos y traspasarlos manualmente a planillas de Excel.
Recopilar y tabular respuestas y preguntas a mano.
Analizar los datos para redactar conclusiones.
Crear gráficos, tomar capturas de pantalla y pegarlas en un documento.
Calcular manualmente la calidad de los instrumentos (Alfa de Cronbach).


Con múltiples carreras, asignaturas y socios comunitarios, este flujo de trabajo manual no es sostenible y es propenso a errores humanos.


Datademy conecta directamente con Google Forms, Google Drive y Google Docs para automatizar todo el proceso:

Recopila automáticamente las respuestas asociadas a los formularios de Google.
Genera gráficos y métricas relevantes (comparativas por carrera, sede, etc.) sin intervención manual.
Calcula el Alfa de Cronbach para evaluar la calidad y confiabilidad de cada instrumento.
Permite visualizar respuestas individuales y aplicar filtros según lo que el usuario necesite.
Cuenta con una pantalla dedicada a la generación de informes: el usuario completa los datos que la app no puede obtener automáticamente, selecciona los filtros apropiados y genera el informe final en cuestión de segundos.
Incluye una app móvil para visualizar y hacer seguimiento de los datos desde cualquier lugar.



Arquitectura del proyecto

Este es un monorepo compuesto por tres aplicaciones independientes:

dazztyn-datademy/
├── backend/          # API REST (NestJS)
├── datademy/         # Aplicación web (React + Vite)
├── datademy-mobile/  # Aplicación móvil (Expo / React Native)
├── docker-compose.yml
└── docker-compose.prod.yml

ComponenteRolbackendAPI REST que orquesta la autenticación con Google, la integración con Google Forms/Drive/Docs, el procesamiento estadístico y la generación de informes.datademyPanel web donde el socio/a de A+S visualiza datos, métricas y genera informes.datademy-mobileApp móvil para consultar y hacer seguimiento de los datos desde el celular.


Stack tecnológico

Backend (/backend)


NestJS (TypeScript) sobre Node.js
MongoDB + Mongoose como base de datos
Redis + Bull para procesamiento asíncrono (cola de trabajos, workers)
Passport con estrategias Google OAuth2.0 y JWT para autenticación
Google APIs (googleapis) para integración con Forms, Drive y Docs
Chart.js para generación de gráficos en los informes
Helmet, class-validator y Throttler para seguridad y validación
Jest para pruebas unitarias y e2e


Frontend web (/datademy)


React 19 + Vite
TypeScript
React Router
Tailwind CSS
Chart.js / react-chartjs-2 y Recharts para visualización de datos
Vitest + Testing Library para pruebas unitarias, Playwright para pruebas e2e


App móvil (/datademy-mobile)


Expo + React Native
Expo Router (ruteo basado en archivos)
NativeWind (Tailwind para React Native)
Google Sign-In para autenticación
react-native-gifted-charts para visualización de datos


Infraestructura


Docker y Docker Compose para orquestar backend, frontend, MongoDB y Redis
Configuraciones separadas para desarrollo (docker-compose.yml) y producción (docker-compose.prod.yml)



Funcionalidades principales


Autenticación con Google OAuth2.0 (con roles de administrador).
Gestión de procesos y formularios: creación, vinculación y configuración de procesos A+S asociados a formularios de Google.
Estadísticas automáticas: cálculo de métricas demográficas, NPS, satisfacción, rankings y comparativas entre carreras/sedes.
Cálculo del Alfa de Cronbach para medir la fiabilidad de los instrumentos.
Generación de informes en Google Docs con gráficos incrustados automáticamente, a partir de datos completados por el usuario y filtros seleccionados.
Panel de administración para la gestión de usuarios y plantillas.
Seguimiento desde la app móvil: visualización de datos globales, detalles, respuestas de estudiantes y de socios.



Puesta en marcha

Requisitos previos


Node.js (v18 o superior recomendado)
Docker y Docker Compose
Una cuenta de Google Cloud con un proyecto configurado (OAuth 2.0 Client ID, y las APIs de Forms, Drive y Docs habilitadas)


1. Clonar el repositorio

bashgit clone <url-del-repositorio>
cd dazztyn-datademy

2. Configurar variables de entorno

Crea un archivo .env dentro de backend/ (usar backend/.env.prod para el entorno de producción) con, al menos, las siguientes variables:

envPORT=3000
FRONTEND_URL=http://localhost:8080

MONGODB_URI=mongodb://mongodb:27017/datademy
REDIS_URL=redis://redis-datademy:6379

# OAuth de Google
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=una_clave_secreta_segura


Los scopes de Google solicitados por la app incluyen email, profile, drive y documents, necesarios para leer los formularios/respuestas y generar los informes en Google Docs.



3. Levantar el proyecto con Docker (recomendado)

bashdocker compose up --build

Esto levantará:


MongoDB en localhost:27017
Redis en localhost:6379
Backend (NestJS) en localhost:3000
Frontend web en localhost:8080


Para producción:

bashdocker compose -f docker-compose.prod.yml up --build -d

4. Ejecución manual (sin Docker)

Backend

bashcd backend
npm install
npm run start:dev

Frontend web

bashcd datademy
npm install
npm run dev

App móvil

bashcd datademy-mobile
npm install
npx expo start


Pruebas

bash# Backend (unitarias y e2e)
cd backend
npm run test
npm run test:e2e

# Frontend web (unitarias)
cd datademy
npm run test

# Frontend web (end-to-end con Playwright)
npm run test:e2e


Estructura resumida del backend

backend/src/
├── auth/            # Autenticación (Google OAuth2.0 + JWT)
├── admin/           # Gestión de administradores
├── usuarios/        # Gestión de usuarios
├── google/          # Integración con Google Drive y Google Forms
├── formularios/      # Procesos, plantillas y configuraciones de formularios
├── estadisticas/     # Cálculo de métricas (NPS, Cronbach, demográficos, comparativas)
└── reportes/         # Generación de informes en Google Docs

Estructura resumida del frontend web

datademy/src/
├── components/      # Componentes reutilizables (modales, tablas, gráficos, sidebar)
├── context/         # Contextos de Auth, Proceso, Informe y Tema
├── hooks/           # Hooks personalizados (métricas, formularios, filtros, etc.)
├── pages/           # Vistas (Login, Dashboard, Panel Admin, secciones de informes)
└── services/        # Llamadas a la API del backend

Estructura resumida de la app móvil

datademy-mobile/
├── app/             # Rutas (file-based routing con Expo Router)
├── components/      # Componentes de UI y gráficos
├── context/         # Contexto de autenticación
├── hooks/           # Hooks de estadísticas, formularios, etc.
└── services/        # Llamadas a la API del backend


👥 Autores


Pablo Jorquera
Vicente Ruiz
Ien Zavala


Proyecto desarrollado para la Universidad Católica del Norte, sede Coquimbo.
