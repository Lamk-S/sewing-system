# Arquitectura Offline-First: Sincronización y Resiliencia

Este documento detalla la estrategia de sincronización implementada en LamkSew. Dado que la aplicación se utiliza en talleres de confección donde la conectividad WiFi es inestable o nula, el sistema fue diseñado con una mentalidad "Local-First". 

La fuente de la verdad inmediata para el usuario es **IndexedDB** (gestionado a través de Dexie.js), mientras que **Supabase** actúa como el motor de persistencia a largo plazo y consolidación global.

## 1. El Problema de la Duplicidad (Y cómo lo resolvemos)

El mayor desafío de los sistemas offline es evitar la duplicación de datos cuando una solicitud de red falla por un *timeout* pero el servidor sí llegó a procesarla, o cuando el usuario recarga la página antes de recibir confirmación.

**Solución: Idempotencia en el Cliente con `local_id`**
En lugar de depender de los IDs incrementales generados por la base de datos (PostgreSQL), cada registro generado en el cliente (producción o turnos) recibe un `local_id` (UUID v4) en el momento exacto de su creación. 

Cuando el sistema recupera la conexión, no realiza un `INSERT` tradicional, sino un `UPSERT` en Supabase con la instrucción `ON CONFLICT (local_id)`. Si el registro ya había llegado al servidor en un intento previo fallido, Supabase simplemente lo actualiza, garantizando **cero duplicados**.

## 2. Flujo de Escritura (Sync Up)

1. **Interacción Local:** El trabajador registra un bulto. 
2. **Dexie.js:** El registro se guarda en IndexedDB con el campo `sync_status: 'pending'`. La UI reacciona instantáneamente (0ms de latencia) gracias a `useLiveQuery`.
3. **Trigger de Red:** El hook `useSyncCatalogs` está suscrito al evento nativo del navegador `window.addEventListener('online')`.
4. **Sincronización:** Al volver la red, se filtran los registros `.where('sync_status').equals('pending')` y se envían a Supabase en bloque.
5. **Confirmación:** Solo si el servidor responde HTTP 200/201, se ejecuta un `bulkUpdate` en Dexie para cambiar el estado a `synced`.

## 3. Flujo de Lectura (Sync Down)

Para que el trabajador pueda operar sin internet, necesita conocer el catálogo de prendas, operaciones y colores. 

* **Estrategia Transaccional:** La descarga de catálogos se realiza utilizando una transacción de lectura/escritura (`'rw'`) de Dexie.js. 
* **Atomicidad:** Se limpia la tabla local (`clear()`) y se insertan los nuevos datos (`bulkAdd()`) dentro de la misma transacción. Esto garantiza que si el trabajador pierde la conexión a mitad de la descarga, no se quede con un catálogo a medias o corrupto.

## 4. Gestión del Estado "Turnos" y el Reloj del Sistema

Un caso límite en entornos offline es la manipulación del reloj del dispositivo.
Si un trabajador inicia turno a las 08:00 AM (sin conexión), cambia la hora de su teléfono a las 04:00 PM y finaliza el turno, podría generar un cobro de horas fraudulento.

**Mitigación actual:** 
La lógica local en `TurnoManager.tsx` implementa un cálculo de integridad básica:
```typescript
const diffMs = new Date(horaFin).getTime() - new Date(turnoActivo.hora_inicio).getTime();
const duracion = Math.max(0, diffMs / 3600000); // Previene horas negativas

```

*Nota: Para entornos altamente estrictos, en futuras iteraciones la validación final del tiempo total del turno se calculará directamente en PostgreSQL a través de un Trigger durante la sincronización.*

## 5. Por qué Dexie.js y no Zustand/Redux-Persist

Aunque herramientas como Redux Persist o Zustand son excelentes para estado de UI, fallan en entornos altamente transaccionales por dos razones:

1. **Memoria:** Mantener miles de registros de producción en la RAM del navegador causa problemas de rendimiento en móviles de gama baja.
2. **Consultas Complejas:** Dexie (IndexedDB) permite realizar queries SQL-like locales (`.where('fecha').equals(hoy)`), lo cual es indispensable para renderizar el Dashboard offline sin iterar sobre arrays gigantes.