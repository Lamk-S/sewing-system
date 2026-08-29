# Contribuir a LamkSew

¡Gracias por tu interés en contribuir! Este proyecto busca resolver problemas reales de conectividad en la industria manufacturera. 

Siendo un sistema con una arquitectura fuertemente orientada al **Offline-First**, tenemos algunas reglas técnicas para asegurar que las nuevas funcionalidades no rompan la experiencia de los operarios en entornos sin red.

## Entorno de Desarrollo

1. **Requisitos:** Node.js (v22+) y `pnpm` (v9+).
2. **Clonar e instalar:**
```bash
git clone [https://github.com/Lamk-S/sewing-system.git](https://github.com/Lamk-S/sewing-system.git)
cd sewing-system
pnpm install
```
3. **Variables de Entorno:**
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
*Nota: Necesitarás proveer tus propias credenciales de un proyecto de Supabase para pruebas E2E locales, o solicitar acceso al entorno de desarrollo abriendo un Issue.*
4. **Levantar el proyecto:**
```bash
pnpm dev

```

## Estructura del Proyecto

Antes de modificar el código, por favor revisa nuestra [Documentación Técnica](https://www.google.com/search?q=./docs/):

* `src/features/`: Módulos principales (producción, dashboards).
* `src/shared/lib/db.ts`: Esquema de la base de datos local (Dexie.js).
* `src/shared/auth/`: Lógica de sesión y roles.

## Regla de Oro: Offline-First

**No asumas que hay internet.**
Cualquier funcionalidad dirigida al "Trabajador/Operario" debe poder ejecutarse localmente.

1. Las lecturas deben hacerse contra `IndexedDB` (vía Dexie `useLiveQuery`).
2. Las escrituras deben generar un `local_id` y marcarse como `sync_status: 'pending'`.
3. Revisa [offline-first.md](https://www.google.com/search?q=./docs/offline-first.md) y [sync.md](https://www.google.com/search?q=./docs/sync.md) antes de enviar un PR que modifique datos.

## Flujo de Ramas (Branching) y Commits

Utilizamos un flujo simplificado basado en la rama `main`:

1. Crea tu rama desde `main`: `git checkout -b feature/nueva-vista` o `fix/error-login`.
2. Escribe mensajes de commit siguiendo la convención [Conventional Commits](https://www.google.com/search?q=https://www.conventionalcommits.org/):
* `feat: add offline production history`
* `fix: prevent duplicate catalog sync`
* `test: cover production payment calculation`
* `docs: update sync flow diagram`

## Proceso de Pull Request

Antes de abrir un Pull Request, debes asegurarte de que tu código pasa nuestro *Quality Gate* local. Ejecuta:

```bash
pnpm check

```

*(Este script ejecutará TypeScript, ESLint, los Tests de Vitest y el Build de producción).*

**En tu PR, por favor incluye:**

1. Qué problema resuelve.
2. Evidencia visual (Screenshots) si afecta la UI.
3. **Confirmación de que probaste la funcionalidad apagando el WiFi (Offline mode en DevTools).**

## Reporte de Bugs y Seguridad

* **Bugs y Features:** Abre un Issue público describiendo los pasos para reproducirlo.
* **Seguridad:** **NO** abras un issue público. Revisa nuestro [SECURITY.md](https://www.google.com/search?q=./SECURITY.md) para conocer el proceso de divulgación responsable.