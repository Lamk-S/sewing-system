'use client'

import { useState, useEffect } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from './button'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

import { Badge } from './badge'
import { Input } from './input'

import { ChevronDown, Search, MoreHorizontal } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onEdit: (item: TData) => void
  onDelete: (id: number) => void
  searchKey?: keyof TData
  title?: string
  addButtonText?: string
  onAddNew?: () => void
}

export function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  onEdit,
  onDelete,
  searchKey = 'nombre' as keyof TData,
  title = 'Datos',
  addButtonText = 'Nuevo',
  onAddNew,
}: DataTableProps<TData, TValue>) {
  const [search, setSearch] = useState('')
  const [filteredData, setFilteredData] = useState<TData[]>(data)

  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(data)
      return
    }

    const filtered = data.filter((item) => {
      const value = String(item[searchKey] ?? '').toLowerCase()
      return value.includes(search.toLowerCase())
    })

    setFilteredData(filtered)
  }, [data, search, searchKey])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

          <Badge variant="secondary">
            {filteredData.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">

          {onAddNew && (
            <Button onClick={onAddNew}>
              + {addButtonText}
            </Button>
          )}

          <div className="relative w-64">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />

          </div>

        </div>

      </div>

      {/* Tabla */}

      <div className="rounded-md border bg-card">

        <Table>

          <TableHeader>

            {table.getHeaderGroups().map((headerGroup) => (

              <TableRow key={headerGroup.id}>

                {headerGroup.headers.map((header) => (

                  <TableHead key={header.id}>

                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}

                        {header.column.getCanSort() && (
                          <ChevronDown className="ml-2 h-4 w-4 inline" />
                        )}
                      </>
                    )}

                  </TableHead>

                ))}

                <TableHead className="text-right">
                  Acciones
                </TableHead>

              </TableRow>

            ))}

          </TableHeader>

          <TableBody>

            {table.getRowModel().rows.length ? (

              table.getRowModel().rows.map((row) => (

                <TableRow key={row.id}>

                  {row.getVisibleCells().map((cell) => (

                    <TableCell key={cell.id}>

                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}

                    </TableCell>

                  ))}

                  <TableCell className="text-right">

                    <DropdownActions
                      onEdit={() => onEdit(row.original)}
                      onDelete={() => onDelete(row.original.id)}
                    />

                  </TableCell>

                </TableRow>

              ))

            ) : (

              <TableRow>

                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >

                  {search
                    ? 'No se encontraron resultados.'
                    : `No hay ${title.toLowerCase()} disponibles.`}

                </TableCell>

              </TableRow>

            )}

          </TableBody>

        </Table>

      </div>

    </div>
  )
}

function DropdownActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {

  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>

        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>

      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">

        <DialogHeader>

          <DialogTitle>
            Acciones
          </DialogTitle>

          <DialogDescription>
            Selecciona una acción para este registro
          </DialogDescription>

        </DialogHeader>

        <div className="grid gap-4 py-4">

          <Button
            variant="outline"
            onClick={() => {
              onEdit()
              setOpen(false)
            }}
          >
            ✏️ Editar
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
          >
            🗑️ Eliminar
          </Button>

        </div>

        <DialogFooter>

          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}