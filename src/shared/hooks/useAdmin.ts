import { useCrud } from './useCrud'

export function useAdmin() {
  const coloresCrud = useCrud('colores')
  const operacionesCrud = useCrud('operaciones')
  const prendasCrud = useCrud('prendas')

  return {
    // === COLORES ===
    colores: coloresCrud.data,
    createColor: coloresCrud.create,
    updateColor: coloresCrud.update,
    deleteColor: coloresCrud.remove,
    refetchColores: coloresCrud.getAll,

    // === OPERACIONES ===
    operaciones: operacionesCrud.data,
    createOperacion: operacionesCrud.create,
    updateOperacion: operacionesCrud.update,
    deleteOperacion: operacionesCrud.remove,
    refetchOperaciones: operacionesCrud.getAll,

    // === PRENDAS ===
    prendas: prendasCrud.data,
    createPrenda: prendasCrud.create,
    updatePrenda: prendasCrud.update,
    deletePrenda: prendasCrud.remove,
    refetchPrendas: prendasCrud.getAll,

    // Estado de carga global (útil para deshabilitar botones en cualquier formulario)
    loading: coloresCrud.loading || operacionesCrud.loading || prendasCrud.loading
  }
}