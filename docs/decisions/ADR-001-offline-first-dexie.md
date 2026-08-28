# ADR-001: Dexie.js e IndexedDB para Persistencia Offline

## Estado
Accepted

## Contexto
El cálculo a destajo en talleres requiere el registro continuo de operaciones. La pérdida de conectividad WiFi en las zonas de producción generaba interrupciones, impidiendo guardar los registros y afectando el cálculo de pago de los trabajadores. Se requería una solución que permitiera almacenamiento local robusto.

## Decisión
Se decidió implementar IndexedDB envuelto por **Dexie.js** como la capa de persistencia local prioritaria (fuente de verdad inmediata) para el rol de Trabajador, reservando Supabase como repositorio de sincronización secundaria.

## Alternativas consideradas
1. **Redux Persist / Zustand (localStorage):** Descartado. `localStorage` es síncrono (bloquea el hilo principal), tiene límite de ~5MB y requiere iterar arrays completos en memoria para buscar un registro de una fecha específica.
2. **Service Worker Background Sync nativo:** Descartado como única fuente. Es volátil y difícil de consultar para mostrar el historial local al usuario antes de que se recupere la conexión.

## Consecuencias
* **Positivo:** Permite búsquedas asíncronas de alto rendimiento (ej. `.where('fecha').equals(hoy)`). El usuario puede registrar 500 operaciones offline sin degradación de UI.
* **Negativo:** Añade complejidad al código (necesidad de mantener esquemas locales, flujos de subida/bajada y gestión manual de estados `pending`/`synced`).

## Justificación
Dexie.js ofrece transacciones atómicas y queries estructuradas. Es la única forma segura en la web actual de emular el comportamiento de una base de datos relacional local sin comprometer el rendimiento en dispositivos de gama baja.