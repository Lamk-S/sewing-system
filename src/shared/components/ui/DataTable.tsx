import { useState, useMemo } from 'react'
import { Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

type Column<T> = {
  header: string
  accessorKey: string
  cell?: (props: { row: { original: T } }) => React.ReactNode
}

type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onDelete?: (id: number) => void
  pageSize?: number // Opcional, por defecto 10
}

export function DataTable<T extends { id?: number }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete,
  pageSize = 10 
}: DataTableProps<T>) {
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    const lowercasedSearch = searchTerm.toLowerCase()
    return data.filter((item) => {
      return Object.values(item).some((value) => 
        String(value).toLowerCase().includes(lowercasedSearch)
      )
    })
  }, [data, searchTerm])

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const validCurrentPage = Math.min(currentPage, totalPages)
  
  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, validCurrentPage, pageSize])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* HEADER: Buscador */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Volver a la pág 1 al buscar
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium hidden sm:block">
          Total: {filteredData.length} registros
        </div>
      </div>

      {/* BODY: Tabla */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              {columns.map((col, idx) => (
                <th key={idx} className="p-4 font-semibold whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="p-4 font-semibold text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-colors group">
                  {columns.map((col, colIndex) => {
                    const keys = col.accessorKey.split('.')
                    const value = keys.reduce((obj: unknown, key: string) => {
                      if (obj && typeof obj === 'object') {
                        return (obj as Record<string, unknown>)[key]
                      }
                      return undefined
                    }, row as unknown) as React.ReactNode

                    return (
                      <td key={colIndex} className="p-4 text-sm text-slate-700">
                        {col.cell ? col.cell({ row: { original: row } }) : value}
                      </td>
                    )
                  })}
                  {(onEdit || onDelete) && (
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 lg:p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg lg:rounded-md transition-colors active:scale-95"
                            title="Editar"
                            aria-label="Editar registro"
                          >
                            <Edit size={18} className="lg:w-4 lg:h-4" />
                          </button>
                        )}
                        {onDelete && row.id && (
                          <button
                            onClick={() => onDelete(row.id!)}
                            className="p-2 lg:p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg lg:rounded-md transition-colors active:scale-95"
                            title="Eliminar"
                            aria-label="Eliminar registro"
                          >
                            <Trash2 size={18} className="lg:w-4 lg:h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando pág <span className="font-semibold text-slate-700">{validCurrentPage}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              aria-label="Página anterior"
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              aria-label="Página siguiente"
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}