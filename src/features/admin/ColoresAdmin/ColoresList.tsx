import { useState, useEffect } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { ColorForm } from './ColorForm'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

export default function ColoresList() {
  const { getColores, deleteColor, loading } = useAdmin()

  const [colores, setColores] = useState<Color[]>([])
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const fetchColores = async () => {
      const { data } = await getColores()
      setColores(data ?? [])
    }

    fetchColores()
  }, [getColores])

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'codigo_hex',
      header: 'Código HEX',
      cell: ({ row }: { row: { original: Color } }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border"
            style={{ backgroundColor: row.original.codigo_hex ?? '#ccc' }}
          />
          <span>{row.original.codigo_hex}</span>
        </div>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Activo',
      cell: ({ row }: { row: { original: Color } }) =>
        row.original.activo ? 'Sí' : 'No',
    },
  ]

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este color?')) return

    await deleteColor(id)

    const { data } = await getColores()
    setColores(data ?? [])
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Colores</h2>

        <button
          onClick={() => {
            setEditingColor(null)
            setShowForm(true)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          disabled={loading}
        >
          + Nuevo Color
        </button>
      </div>

      <DataTable
        columns={columns}
        data={colores}
        onEdit={(color: Color) => {
          setEditingColor(color)
          setShowForm(true)
        }}
        onDelete={handleDelete}
      />

      {showForm && (
        <ColorForm
          color={editingColor}
          onClose={async () => {
            setShowForm(false)
            setEditingColor(null)

            const { data } = await getColores()
            setColores(data ?? [])
          }}
        />
      )}
    </div>
  )
}