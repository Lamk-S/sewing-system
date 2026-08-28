# Política de Seguridad (Security Policy)

En el proyecto **LamkSew**, la seguridad de los datos de producción y de los trabajadores es una prioridad fundamental. Esta política describe nuestras prácticas y cómo reportar posibles vulnerabilidades.

## Versiones Soportadas

Actualmente, solo la rama principal (`main`) y las versiones desplegadas en producción reciben actualizaciones de seguridad.

| Versión | Soportada          |
| ------- | ------------------ |
| Main    | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporte de Vulnerabilidades (Vulnerability Reporting)

**Por favor, NO abras un Issue público para reportar una vulnerabilidad de seguridad.**

Para reportar problemas de seguridad, utiliza la función [Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) de GitHub disponible en la pestaña `Security > Advisories` de este repositorio.

Incluye la siguiente información en tu reporte:
1. Tipo de vulnerabilidad (ej. XSS, escalada de privilegios).
2. Pasos detallados para reproducir el problema.
3. El impacto potencial en el sistema o los usuarios.

Nos comprometemos a confirmar la recepción de tu reporte en un plazo razonable y a mantenerte informado sobre el estado de la mitigación.

## Consideraciones de Arquitectura (Threat Model)

Para investigadores de seguridad, por favor tengan en cuenta el siguiente modelo de amenazas antes de reportar:

* **Supabase Anon Key:** La clave `VITE_SUPABASE_ANON_KEY` es pública por diseño en la arquitectura de Supabase. Su exposición en el frontend no es una vulnerabilidad. El control de acceso está respaldado estrictamente por **Row Level Security (RLS)** en PostgreSQL. Reportes indicando que la *anon_key* es visible serán ignorados.
* **Almacenamiento Local (Offline-First):** Debido a la naturaleza Offline-First de la aplicación (PWA), los datos de los turnos se almacenan en `IndexedDB` (vía Dexie.js) en texto plano. Se asume que la seguridad física del dispositivo y el bloqueo del sistema operativo son responsabilidad del usuario o de la administración del taller.