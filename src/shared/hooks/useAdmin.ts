import { useCrud } from './useCrud'

export function useAdmin() {
  const coloresCrud = useCrud('colores')
  const operacionesCrud = useCrud('operaciones')
  const prendasCrud = useCrud('prendas')

  return {
    colores: coloresCrud.data,
    createColor: coloresCrud.create,
    updateColor: coloresCrud.update,
    deleteColor: coloresCrud.remove,
    refetchColores: coloresCrud.refetch,

    operaciones: operacionesCrud.data,
    createOperacion: operacionesCrud.create,
    updateOperacion: operacionesCrud.update,
    deleteOperacion: operacionesCrud.remove,
    refetchOperaciones: operacionesCrud.refetch,

    prendas: prendasCrud.data,
    createPrenda: prendasCrud.create,
    updatePrenda: prendasCrud.update,
    deletePrenda: prendasCrud.remove,
    refetchPrendas: prendasCrud.refetch,

    loading: coloresCrud.isLoading || operacionesCrud.isLoading || prendasCrud.isLoading,
    error: coloresCrud.error || operacionesCrud.error || prendasCrud.error
  }
}