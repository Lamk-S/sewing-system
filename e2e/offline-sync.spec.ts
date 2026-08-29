import { test, expect } from '@playwright/test'

test.describe('Flujo Offline-First del Trabajador', () => {
  // Se desactivan los Service Workers para aislar la prueba.
  // De esta manera, la validación se concentra en IndexedDB y en el comportamiento de red.
  test.use({ serviceWorkers: 'block' })

  test('debe guardar localmente sin red y sincronizar al reconectar', async ({ page, context }) => {
    // =========================================================
    // 1. MOCK DE API (SUPABASE AUTH Y DATOS REMOTOS)
    // =========================================================

    // Se simula el endpoint de login de Supabase.
    // Esto permite probar la interfaz real de inicio de sesión sin depender de usuarios reales.
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          // Supabase v2 requiere un JWT con estructura válida (Header.Payload.Signature).
          access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6InRlc3QtdXNlci1pZC0xMjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyNzkzMDQ4NDAwfQ.Signature",
          expires_in: 3600,
          refresh_token: "fake-refresh-token",
          token_type: "bearer",
          user: { id: 'test-user-id-123', aud: 'authenticated', role: 'authenticated' }
        })
      })
    })

    // Se simula la recuperación de la sesión activa al recargar la página.
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ id: 'test-user-id-123', aud: 'authenticated', role: 'authenticated' })
      })
    })

    // Se simulan las consultas de autorización (Roles y Perfiles).
    await page.route('**/rest/v1/rpc/get_user_rol', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify('trabajador') })
    })
    
    await page.route('**/rest/v1/perfiles*', async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify([{ id: 'test-user-id-123', rol: 'trabajador', nombres: 'Test', apellidos: 'User' }]) 
      })
    })

    // Se interceptan las peticiones de creación de destajos para evitar ensuciar la base de datos real.
    await page.route('**/rest/v1/registros_produccion*', async (route) => {
      const method = route.request().method()
      if (method === 'POST' || method === 'PATCH') {
        await route.fulfill({ status: 201, body: JSON.stringify([{}]) })
      } else {
        await route.continue()
      }
    })

    // =========================================================
    // 2. INICIO DE SESIÓN A TRAVÉS DE LA UI
    // =========================================================

    // Se navega a la raíz (Pantalla de Login).
    await page.goto('/')

    // Se completan los campos utilizando los selectores accesibles de Playwright.
    await page.getByLabel(/Correo Electrónico/i).fill('worker@demo.com')
    await page.getByLabel(/Contraseña/i).fill('demo1234')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()

    // El sistema procesa el mock login y redirige automáticamente a la vista de producción.
    await expect(page.getByRole('heading', { name: /Registro de Producción/i })).toBeVisible()

    // =========================================================
    // 3. INYECCIÓN DE DATOS LOCALES (SEED DE DEXIE)
    // =========================================================

    // Una vez garantizada la existencia del esquema de Dexie, se inyectan los catálogos.
    await page.evaluate(async () => {
      return new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.open('SewingDB')

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const database = request.result
          const requiredStores = ['turnos', 'prendas', 'operaciones', 'colores']

          // Se verifica como medida de seguridad que Dexie efectivamente haya creado las tablas.
          const storesReady = requiredStores.every((store) =>
            database.objectStoreNames.contains(store)
          )

          if (!storesReady) {
            database.close()
            return reject(new Error('Las tablas no fueron generadas por la aplicación.'))
          }

          try {
            const transaction = database.transaction(requiredStores, 'readwrite')

            transaction.oncomplete = () => {
              database.close()
              resolve()
            }
            transaction.onerror = () => {
              database.close()
              reject(transaction.error)
            }

            transaction.objectStore('turnos').put({
              id: 1,
              local_id: 'fake-turno-id',
              trabajador_id: 'test-user-id-123',
              fecha: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
              hora_inicio: new Date().toISOString(),
              estado: 'abierto',
              sync_status: 'pending',
            })

            transaction.objectStore('prendas').put({ id: 1, codigo: 'PR-1', nombre: 'Polo', activo: true })
            transaction.objectStore('operaciones').put({ id: 1, prenda_id: 1, nombre: 'Costura Recta', precio_fijo: 1.5, activo: true })
            transaction.objectStore('colores').put({ id: 1, nombre: 'Rojo', activo: true })

          } catch (error) {
            database.close()
            reject(error)
          }
        }
      })
    })

    // Se recarga la página para que la UI de React detecte los nuevos datos locales.
    await page.reload()
    await expect(page.getByRole('heading', { name: /Registro de Producción/i })).toBeVisible()

    // =========================================================
    // 4. VALIDACIÓN DEL FUNCIONAMIENTO OFFLINE
    // =========================================================

    // Se desactiva la conexión de red simulando un entorno sin WiFi.
    await context.setOffline(true)

    // Se completan los campos del formulario de destajo.
    await page.locator('select#prendaSelect').selectOption('1')
    await page.locator('select#operacionSelect').selectOption('1')
    await page.locator('select#colorSelect').selectOption('1')
    await page.locator('input#cantidadInput').fill('50')

    await page.getByRole('button', { name: /Registrar Bulto/i }).click()

    // Se verifica el mensaje de confirmación local.
    await expect(page.getByText(/Bulto guardado localmente/i)).toBeVisible()

    // Se utiliza el enrutamiento del lado del cliente (React Router) 
    // haciendo clic en la interfaz, en lugar de forzar una petición HTTP con page.goto().
    await page.getByRole('link', { name: /Mi Historial/i }).click()

    // Se comprueba la persistencia en el historial local.
    await expect(page.getByText('Costura Recta')).toBeVisible()

    const offlineBadge = page.locator('span[title="Pendiente de enviar al servidor"]')
    await expect(offlineBadge).toBeVisible()
    await expect(offlineBadge).toContainText(/Offline/i)

    // =========================================================
    // 5. VALIDACIÓN DE LA SINCRONIZACIÓN
    // =========================================================

    // Se restablece la conexión a internet.
    await context.setOffline(false)

    // Se dispara el evento nativo del navegador para activar la sincronización.
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // Se verifica que la interfaz refleje el guardado en la nube.
    const syncedBadge = page.locator('span[title="Guardado en el servidor"]')
    await expect(syncedBadge).toBeVisible({ timeout: 10000 })
    await expect(syncedBadge).toContainText(/Nube/i)
  })
})