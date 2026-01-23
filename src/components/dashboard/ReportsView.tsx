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
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function ReportsView() {
  const { barbershop } = useUserData();
  const { lang, t } = useI18n();
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
            <p className="text-muted-foreground">{t("reports.setupRequired" as any)}</p>
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
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("reports.title" as any)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("reports.subtitle" as any)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("reports.period.placeholder" as any)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("reports.period.today" as any)}</SelectItem>
              <SelectItem value="week">{t("reports.period.week" as any)}</SelectItem>
              <SelectItem value="month">{t("reports.period.month" as any)}</SelectItem>
              <SelectItem value="lastMonth">{t("reports.period.lastMonth" as any)}</SelectItem>
              <SelectItem value="year">{t("reports.period.year" as any)}</SelectItem>
              <SelectItem value="custom">{t("reports.period.custom" as any)}</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <>
              <Popover open={customStartOpen} onOpenChange={setCustomStartOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart
                      ? format(customStart, "dd/MM/yyyy")
                      : t("reports.period.from" as any)}
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
                    {customEnd ? format(customEnd, "dd/MM/yyyy") : t("reports.period.to" as any)}
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
                {t("reports.export.summary" as any)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportPDF("detailed")}
                disabled={isLoading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t("reports.export.detailed" as any)}
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
                    <p className="text-sm text-muted-foreground">
                      {t("reports.summary.totalAppointments" as any)}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {t("reports.summary.completed" as any)}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {t("reports.summary.totalRevenue" as any)}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue, barbershop?.currency || "USD", lang)}</p>
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
                    <p className="text-sm text-muted-foreground">
                      {t("reports.summary.canceled" as any)}
                    </p>
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
                  {t("reports.revenue.title" as any)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("reports.revenue.paid" as any)}
                  </span>
                  <span className="font-semibold text-success">
                    {formatCurrency(reportData.summary.paidRevenue, barbershop?.currency || "USD", lang)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("reports.revenue.pending" as any)}
                  </span>
                  <span className="font-semibold text-warning">
                    {formatCurrency(reportData.summary.unpaidRevenue, barbershop?.currency || "USD", lang)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {t("reports.status.title" as any)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{t("reports.status.pending" as any)}</Badge>
                  <span className="font-semibold">{reportData.byStatus.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{t("reports.status.confirmed" as any)}</Badge>
                  <span className="font-semibold">{reportData.byStatus.confirmed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{t("reports.status.completed" as any)}</Badge>
                  <span className="font-semibold">{reportData.byStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{t("reports.status.noShow" as any)}</Badge>
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
                  {t("reports.staff.title" as any)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF("staff")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {t("reports.export.button" as any)}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.byStaff.map((staff) => (
                    <div key={staff.staffId} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{staff.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("reports.staff.appointments" as any).replace(
                            "{count}",
                            String(staff.appointmentCount),
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(staff.revenue, barbershop?.currency || "USD", lang)}</p>
                        {staff.commission !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {t("reports.staff.commission" as any).replace(
                              "{amount}",
                              formatCurrency(staff.commission, barbershop?.currency || "USD", lang),
                            )}
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
                  {t("reports.services.title" as any)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF("services")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {t("reports.export.button" as any)}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.byService.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{service.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("reports.services.usage" as any).replace(
                            "{count}",
                            String(service.appointmentCount),
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(service.revenue, barbershop?.currency || "USD", lang)}</p>
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
                <p className="mt-4 text-lg font-semibold">
                  {t("reports.empty.title" as any)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("reports.empty.subtitle" as any)}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{t("reports.error" as any)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
