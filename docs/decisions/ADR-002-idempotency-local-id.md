# ADR-002: Idempotencia basada en UUIDs Locales (`local_id`)

## Estado
Accepted

## Contexto
Al implementar sincronización asíncrona, surge el problema del "General Bizantino". Si el cliente envía datos al servidor, pero la conexión se corta antes de recibir la confirmación (HTTP 200), el cliente asume que falló. Al reconectarse, reenviará la data, generando duplicados en la base de datos y pagando doble a los operarios.

## Decisión
Descartar el uso de IDs incrementales de base de datos (generados por Postgres) para las transacciones originadas offline. En su lugar, el cliente genera un `local_id` (UUIDv4) en el momento de crear el registro, utilizándolo para ejecutar un `upsert` basado en conflictos (`onConflict: 'local_id'`).

## Consecuencias
* **Positivo:** Se garantiza la idempotencia absoluta. No importa si el cliente reintenta 10 veces la misma petición por fallos de red; el servidor nunca creará duplicados.
* **Negativo:** Los registros de Supabase requieren una columna extra única (`local_id` de tipo `uuid`).

## Justificación
La seguridad financiera (no duplicar pagos) tiene prioridad absoluta sobre el pequeño costo de almacenamiento de un campo UUID adicional en PostgreSQL.