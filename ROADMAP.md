# Roadmap del Proyecto (LamkSew)

Este documento refleja el estado actual del proyecto, los hitos alcanzados y las prioridades futuras. El sistema se encuentra en desarrollo activo y abierto a contribuciones.

## Completado (Done)

**Ingeniería & Calidad**
* [x] Configuración base: React 19 + TypeScript + Vite.
* [x] Arquitectura de persistencia local (Dexie.js / IndexedDB).
* [x] Pipeline CI/CD (GitHub Actions) con validación estricta de tipos y linting.
* [x] Suite de testing automatizado (Vitest + RTL) focalizada en lógicas puras y estados offline.
* [x] Controles de seguridad automatizados (Dependabot, Secret Scanning, CodeQL).
* [x] Documentación técnica integral (`docs/`).
* [x] Testing End-to-End (E2E): Implementación de Playwright simulando `context.setOffline(true)` para validar resiliencia de red.
* [x] Auditoría PWA y Performance base mediante Lighthouse CI.

**Producto (Features)**
* [x] Autenticación y Autorización basada en Roles (Supabase Auth + RLS).
* [x] Registro de producción de destajo 100% offline.
* [x] Motor de sincronización asíncrona (Sync Up/Down) con resolución de conflictos (`local_id`).
* [x] Gestión de turnos y reloj interno resiliente.
* [x] Dashboards de administración con TanStack Query (Online).
* [x] Exportación nativa de reportes a PDF y Excel.

## En Progreso (In Progress)

* [ ] **Live Demo Automatizada:** Despliegue de un entorno efímero seguro para evaluadores (aislado de la BD de producción).
* [ ] **Code Splitting:** Separación perezosa (`React.lazy`) de las librerías de exportación (`exceljs`, `jspdf`) para optimizar el bundle inicial del trabajador.

## Planificado (Planned)

**Prioridad Alta (P1)**
* [ ] Refactorización de servicios de red: Extraer llamadas a Supabase fuera de los componentes React para facilitar mocks en testing superior.

**Prioridad Media (P2)**
* [ ] Sistema de notificaciones en PWA (Push API) para informar al operario sobre pagos consolidados semanales.
* [ ] Manejo avanzado de conflictos: UI para que el administrador resuelva discrepancias de sincronización si las validaciones RLS rechazan un registro.