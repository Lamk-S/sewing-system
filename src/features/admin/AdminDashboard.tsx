import PrendasList from './PrendasAdmin/PrendasList'
import ColoresList from './ColoresAdmin/ColoresList'
import OperacionesList from './OperacionesAdmin/OperacionesList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'

export default function AdminDashboard() {

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona prendas, colores y operaciones
        </p>
      </div>

      <Tabs defaultValue="prendas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prendas">Prendas</TabsTrigger>
          <TabsTrigger value="colores">Colores</TabsTrigger>
          <TabsTrigger value="operaciones">Operaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="prendas" className="mt-6">
          <PrendasList />
        </TabsContent>
        <TabsContent value="colores" className="mt-6">
          <ColoresList />
        </TabsContent>
        <TabsContent value="operaciones" className="mt-6">
          <OperacionesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}