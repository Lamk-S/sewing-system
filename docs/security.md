# Arquitectura de Seguridad

Complementando la [Política de Seguridad](../SECURITY.md) pública, este documento detalla los mecanismos técnicos que protegen a la aplicación.

## 1. El Frontend No Es Confiable
LamkSew sigue el principio de *Zero Trust* en el cliente. Ocultar botones o vistas mediante React (ej. `<RequireAdmin>`) es una medida de UX (User Experience), no de seguridad. Un usuario malintencionado podría alterar el código JS en memoria para mostrar el dashboard administrativo.

La seguridad real reside 100% en la base de datos (PostgreSQL).

## 2. Autorización (PostgreSQL RLS)
Se utiliza *Row Level Security* (RLS) para garantizar el aislamiento de datos.
* **Trabajadores:** Las políticas aseguran que `auth.uid() = trabajador_id`. Si un trabajador intenta inyectar un registro para otro usuario, la base de datos rechazará el `INSERT`.
* **Administradores:** Se definió la función `get_user_rol()` en la BD. Las políticas de `UPDATE/DELETE` de catálogos requieren que esta función devuelva `'admin'`.

*Nota:* Las vistas estadísticas (ej. `v_ranking_trabajadores`) tienen configurado `security_invoker = true` para que los permisos RLS se apliquen también al leer la vista.

## 3. Gestión de Secretos
El archivo `.env` solo expone credenciales públicas de Supabase:
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
Estas llaves son seguras para distribuirse en el bundle JS. El proyecto **no utiliza** ni debe utilizar la clave `service_role` bajo ninguna circunstancia, ya que esta eludiría el RLS.

## 4. Riesgos Asumidos de IndexedDB (PWA)
Los datos offline se guardan en IndexedDB sin cifrado asimétrico complejo.
* **Riesgo:** Un atacante con acceso físico al dispositivo desbloqueado podría leer los catálogos y la producción del día.
* **Mitigación actual:** Dependencia en el sistema de cierre de sesión (`auth.signOut()` que idealmente debería purgar la BD local) y en las políticas de seguridad físicas del taller (contraseñas en dispositivos).