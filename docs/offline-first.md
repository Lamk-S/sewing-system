# Arquitectura Offline-First

¿Qué significa "Offline-First" en LamkSew? Significa que el flujo crítico del operario asume que **no hay internet por defecto**. La fuente de la verdad inmediata para el usuario es IndexedDB.

## 1. Lo que funciona 100% Offline
* **Catálogos:** Lectura de prendas, operaciones y colores (previamente cacheados).
* **Turnos:** Iniciar, calcular tiempo y finalizar turnos.
* **Producción:** Registrar bultos o destajos.
* **Historial local:** Ver lo que se ha producido en el día.

## 2. Lo que REQUIERE conexión a Internet
* **Login inicial:** Obtener el JWT de Supabase por primera vez.
* **Administración:** Ver dashboards consolidados, exportar reportes, editar catálogos y gestionar usuarios.
* **Sync Inicial/Descendente:** Obtener nuevos catálogos si el admin agregó un nuevo color o prenda.

## 3. Comportamiento por Entidad

* **Catálogos (Solo lectura offline):** Los catálogos no se editan offline. El cliente los descarga cuando hay red y los guarda en IndexedDB.
* **Producción (Lectura/Escritura offline):** El operario genera registros de producción. Se guardan localmente asignando un estado inicial `sync_status = 'pending'`. El trabajador ve inmediatamente su registro con un indicador visual de "Pendiente" u "Offline".
* **Turnos:** Siguen el mismo patrón de la producción. La duración se calcula mediante diferencias de timestamps locales para que la UI reaccione incluso sin internet.

Consulta [Sincronización](./sync.md) para ver cómo estos datos llegan finalmente al servidor.