import React, { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Input } from './input'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export interface ColumnDef<T> {
  header: string
  accessorKey?: string 
  cell?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchPlaceholder?: string
  searchableKey?: keyof T 
  pageSize?: number
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!path || typeof obj !== 'object' || obj === null) return undefined;
  
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T>({ 
  data, 
  columns, 
  searchPlaceholder = "Buscar...", 
  searchableKey,
  pageSize = 10 
}: DataTableProps<T>) {
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchableKey) {
        const val = String(item[searchableKey] || '').toLowerCase();
        return val.includes(lowerSearch);
      }
      
      return Object.values(item as Record<string, unknown>).some(val => 
        (typeof val === 'string' || typeof val === 'number') && 
        String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchTerm, searchableKey])

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  return (
    <div className="space-y-4">
      <div className="flex items-center relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={String((row as Record<string, unknown>).id ?? rowIndex)}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.cell 
                        ? col.cell(row) 
                        : col.accessorKey 
                          ? String(getNestedValue(row, col.accessorKey) ?? '')
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Mostrando {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} a {Math.min(filteredData.length, currentPage * pageSize)} de {filteredData.length}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}