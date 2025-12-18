import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData } from "@/hooks/useReports";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BarbershopInfo {
  name: string;
  address?: string;
  phone?: string;
}

export function generateReportPDF(
  reportData: ReportData,
  barbershopInfo: BarbershopInfo,
  reportType: "summary" | "detailed" | "staff" | "services" = "summary"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Trimly", margin, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(barbershopInfo.name, margin, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (barbershopInfo.address) {
    doc.text(barbershopInfo.address, margin, yPos);
    yPos += 5;
  }
  if (barbershopInfo.phone) {
    doc.text(`Tel: ${barbershopInfo.phone}`, margin, yPos);
    yPos += 5;
  }
  
  yPos += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Período: ${reportData.period.label}`, margin, yPos);
  
  yPos += 5;
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}`, margin, yPos);
  
  yPos += 15;

  // Summary section
  if (reportType === "summary" || reportType === "detailed") {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen General", margin, yPos);
    yPos += 10;

    const summaryData = [
      ["Total de Citas", reportData.summary.totalAppointments.toString()],
      ["Citas Completadas", reportData.summary.completedAppointments.toString()],
      ["Citas Canceladas", reportData.summary.canceledAppointments.toString()],
      ["Ingresos Totales", `$${reportData.summary.totalRevenue.toFixed(2)}`],
      ["Ingresos Pagados", `$${reportData.summary.paidRevenue.toFixed(2)}`],
      ["Ingresos Pendientes", `$${reportData.summary.unpaidRevenue.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Métrica", "Valor"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: [228, 85, 0], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      margin: { left: margin, right: margin },
    });

      yPos = (doc as any).lastAutoTable?.finalY || yPos + 15;
  }

  // By Status section
  if (reportType === "summary" || reportType === "detailed") {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Citas por Estado", margin, yPos);
    yPos += 10;

    const statusData = [
      ["Pendientes", reportData.byStatus.pending.toString()],
      ["Confirmadas", reportData.byStatus.confirmed.toString()],
      ["Completadas", reportData.byStatus.completed.toString()],
      ["Canceladas", reportData.byStatus.canceled.toString()],
      ["No Presentados", reportData.byStatus.no_show.toString()],
      ["Reprogramadas", reportData.byStatus.rescheduled.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Estado", "Cantidad"]],
      body: statusData,
      theme: "striped",
      headStyles: { fillColor: [228, 85, 0], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      margin: { left: margin, right: margin },
    });

      yPos = (doc as any).lastAutoTable?.finalY || yPos + 15;
  }

  // By Staff section
  if ((reportType === "summary" || reportType === "detailed" || reportType === "staff") && reportData.byStaff.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Rendimiento por Barbero", margin, yPos);
    yPos += 10;

    const staffData = reportData.byStaff.map((staff) => [
      staff.staffName,
      staff.appointmentCount.toString(),
      `$${staff.revenue.toFixed(2)}`,
      staff.commission !== undefined ? `$${staff.commission.toFixed(2)}` : "N/A",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Barbero", "Citas", "Ingresos", "Comisión"]],
      body: staffData,
      theme: "striped",
      headStyles: { fillColor: [228, 85, 0], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      margin: { left: margin, right: margin },
    });

      yPos = (doc as any).lastAutoTable?.finalY || yPos + 15;
  }

  // By Service section
  if ((reportType === "summary" || reportType === "detailed" || reportType === "services") && reportData.byService.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Rendimiento por Servicio", margin, yPos);
    yPos += 10;

    const serviceData = reportData.byService.map((service) => [
      service.serviceName,
      service.appointmentCount.toString(),
      `$${service.revenue.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Servicio", "Cantidad", "Ingresos"]],
      body: serviceData,
      theme: "striped",
      headStyles: { fillColor: [228, 85, 0], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      margin: { left: margin, right: margin },
    });

      yPos = (doc as any).lastAutoTable?.finalY || yPos + 15;
  }

  // Detailed appointments list
  if (reportType === "detailed" && reportData.appointments.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Citas", margin, yPos);
    yPos += 10;

    const appointmentsData = reportData.appointments.map((apt) => [
      apt.date,
      apt.time,
      apt.clientName,
      apt.staffName,
      apt.services.substring(0, 30) + (apt.services.length > 30 ? "..." : ""),
      `$${apt.total.toFixed(2)}`,
      apt.status,
      apt.paymentStatus === "paid" ? "Pagado" : "Pendiente",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Fecha", "Hora", "Cliente", "Barbero", "Servicios", "Total", "Estado", "Pago"]],
      body: appointmentsData,
      theme: "striped",
      headStyles: { fillColor: [228, 85, 0], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
      columnStyles: {
        4: { cellWidth: 40 },
        5: { halign: "right" },
      },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Página ${i} de ${totalPages} - Trimly`,
      pageWidth - margin - 50,
      pageHeight - 10
    );
  }

  return doc;
}

export function downloadReportPDF(
  reportData: ReportData,
  barbershopInfo: BarbershopInfo,
  reportType: "summary" | "detailed" | "staff" | "services" = "summary"
) {
  const doc = generateReportPDF(reportData, barbershopInfo, reportType);
  const fileName = `reporte-${reportData.period.label.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
