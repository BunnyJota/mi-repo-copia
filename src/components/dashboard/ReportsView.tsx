import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports, type ReportPeriod } from "@/hooks/useReports";
import { useUserData } from "@/hooks/useUserData";
import { downloadReportPDF } from "@/lib/pdfReports";
import { 
  FileDown, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Users, 
  Scissors,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ReportsView() {
  const { barbershop } = useUserData();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);

  const { data: reportData, isLoading } = useReports(
    period,
    period === "custom" ? customStart : undefined,
    period === "custom" ? customEnd : undefined
  );

  const handleExportPDF = (type: "summary" | "detailed" | "staff" | "services") => {
    if (!reportData || !barbershop) return;
    
    downloadReportPDF(
      reportData,
      {
        name: barbershop.name,
        address: barbershop.address || undefined,
        phone: barbershop.phone || undefined,
      },
      type
    );
  };

  if (!barbershop) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Configura tu barbería para ver reportes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector and export buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Reportes y Analytics</h2>
          <p className="text-sm text-muted-foreground">Analiza el rendimiento de tu barbería</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes pasado</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <>
              <Popover open={customStartOpen} onOpenChange={setCustomStartOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, "dd/MM/yyyy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={(date) => {
                      setCustomStart(date);
                      setCustomStartOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={customEndOpen} onOpenChange={setCustomEndOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, "dd/MM/yyyy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={(date) => {
                      setCustomEnd(date);
                      setCustomEndOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          {reportData && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportPDF("summary")}
                disabled={isLoading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Resumen PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportPDF("detailed")}
                disabled={isLoading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Completo PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Period label */}
      {reportData && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {reportData.period.label}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                    <p className="mt-1 text-2xl font-bold">{reportData.summary.totalAppointments}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                    <p className="mt-1 text-2xl font-bold">{reportData.summary.completedAppointments}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                    <p className="mt-1 text-2xl font-bold">${reportData.summary.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                    <p className="mt-1 text-2xl font-bold">{reportData.summary.canceledAppointments}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue breakdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagados</span>
                  <span className="font-semibold text-success">
                    ${reportData.summary.paidRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pendientes</span>
                  <span className="font-semibold text-warning">
                    ${reportData.summary.unpaidRevenue.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Estado de Citas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Pendientes</Badge>
                  <span className="font-semibold">{reportData.byStatus.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Confirmadas</Badge>
                  <span className="font-semibold">{reportData.byStatus.confirmed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Completadas</Badge>
                  <span className="font-semibold">{reportData.byStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">No Presentados</Badge>
                  <span className="font-semibold">{reportData.byStatus.no_show}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Staff */}
          {reportData.byStaff.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Rendimiento por Barbero
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF("staff")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.byStaff.map((staff) => (
                    <div key={staff.staffId} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{staff.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          {staff.appointmentCount} citas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${staff.revenue.toFixed(2)}</p>
                        {staff.commission !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Comisión: ${staff.commission.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Service */}
          {reportData.byService.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Rendimiento por Servicio
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF("services")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.byService.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{service.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.appointmentCount} veces
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${service.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {reportData.summary.totalAppointments === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">No hay datos para este período</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecciona otro período o espera a que se generen citas.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No se pudieron cargar los reportes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
