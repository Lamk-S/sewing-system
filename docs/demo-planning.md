# Plan de Implementación: Live Demo

Este documento establece la arquitectura y los requisitos de infraestructura necesarios para desplegar una versión de demostración pública (Live Demo) de LamkSew. 

Actualmente, no se expone una demo viva en el repositorio público para proteger la integridad de los datos, evitar el abuso de la capa gratuita de infraestructura y mantener la seguridad del modelo de datos base.

## 1. Requisitos de Infraestructura (Demo Environment)

Para habilitar la demo sin riesgos, se requiere levantar un entorno totalmente aislado:
* **Hosting Frontend:** Vercel o Netlify (concluido desde una rama específica o variable de entorno `VITE_APP_ENV=demo`).
* **BaaS:** Un proyecto de Supabase separado del entorno de desarrollo y producción.

## 2. Gestión de Datos Efímeros (Auto-Reset)

La demo debe auto-limpiarse para ofrecer una experiencia fresca a cada reclutador o ingeniero que la visite.
* **Cron Job:** Se configurará una *Supabase Edge Function* programada vía `pg_cron` para ejecutarse todos los días a la medianoche (UTC).
* **Flujo del Reset:**
  1. Ejecución de `TRUNCATE TABLE registros_produccion, turnos CASCADE;`.
  2. Restauración del catálogo maestro de prueba (Seed: 5 prendas, 15 operaciones, 8 colores).

## 3. Cuentas de Acceso (Static Demo Accounts)

El registro público de nuevos usuarios estará deshabilitado. Se proveerán dos cuentas estáticas documentadas en el README para evaluar las dos caras del sistema:

### Cuenta Trabajador (Operador)
* **Credenciales:** `worker@demo.com` / `demo1234`
* **Permisos RLS:** Puede insertar registros localmente, simular la sincronización y ver su propio historial.
* **Objetivo de la prueba:** Demostrar la resiliencia offline-first y la experiencia de usuario (UX) en la carga rápida de destajos.

### Cuenta Administrador
* **Credenciales:** `admin@demo.com` / `demo1234`
* **Permisos RLS:** Rol "admin". Acceso total a dashboards de lectura, rankings y catálogos.
* **Objetivo de la prueba:** Demostrar las vistas SQL, la agregación de datos y la gestión operativa.

## 4. Riesgos de Seguridad y Mitigaciones (Abuse Prevention)

El mayor riesgo de una demo pública abierta es el abuso mediante scripts (Spam) que saturen la capacidad de almacenamiento o los límites de la API de Supabase.

**Políticas RLS Específicas para la Demo:**
Se añadirán reglas restrictivas en PostgreSQL exclusivas para el entorno demo:

1. **Límite de Inserciones Diarias (Rate Limiting en DB):**
   ```sql
   CREATE POLICY "Demo_Rate_Limit" ON registros_produccion
   FOR INSERT TO authenticated
   WITH CHECK (
     (SELECT count(*) FROM registros_produccion 
      WHERE trabajador_id = auth.uid() AND fecha_trabajo = CURRENT_DATE) < 150
   );

*Efecto: Si un bot intenta insertar más de 150 registros en un día, la base de datos rechazará la transacción silenciosamente.*

2. **Bloqueo de Mutación Estructural:**
Para evitar que usuarios curiosos rompan la demo borrando el catálogo base, la cuenta `admin@demo.com` tendrá bloqueadas las operaciones `DELETE` sobre las tablas de configuración (prendas, operaciones).

## 5. Guía de Pruebas Offline para el Usuario (Futura documentación)

Cuando la demo esté activa, se incluirán instrucciones explícitas en el frontend para enseñar al visitante cómo probar la ingeniería detrás de la app:

1. Iniciar sesión como Trabajador.
2. Abrir las **DevTools (F12)** -> Pestaña **Network** -> Seleccionar **Offline**.
3. Iniciar un turno y registrar 3 operaciones. (Observar etiqueta "Offline").
4. Volver a seleccionar **Online** (o "No throttling").
5. Observar cómo la etiqueta cambia automáticamente a "Nube" y revisar la petición de sincronización en la pestaña *Network*.