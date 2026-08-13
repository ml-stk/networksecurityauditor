import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisSummary } from '../types';

export interface PdfExportOptions {
  companyName?: string;
  adminName?: string;
  notes?: string;
  includeRemediationCommands?: boolean;
  includeRouteTable?: boolean;
}

export function generateAuditPdf(
  summary: AnalysisSummary,
  options: PdfExportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  let currentY = 15;

  // Title Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NetRoute Audit Report', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FortiGate & Cisco Network Routing & SD-WAN Analysis', 14, 25);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${reportDate}`, 135, 25);

  currentY = 40;

  // Metadata Card
  if (options.companyName || options.adminName || options.notes) {
    doc.setFillColor(...lightBg);
    doc.roundedRect(14, currentY, 182, 22, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 22, 3, 3, 'D');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    let metaX = 18;
    if (options.companyName) {
      doc.text(`Organization: ${options.companyName}`, metaX, currentY + 8);
      metaX += 60;
    }
    if (options.adminName) {
      doc.text(`Administrator: ${options.adminName}`, metaX, currentY + 8);
    }
    if (options.notes) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Notes: ${options.notes}`, 18, currentY + 16);
    }

    currentY += 28;
  }

  // Executive Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, 182, 36, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Executive Audit Overview', 18, currentY + 10);

  // Health Grade Badge
  doc.setFontSize(18);
  const gradeColor = summary.healthGrade === 'A' ? [22, 163, 74] :
                     summary.healthGrade === 'B' ? [14, 165, 233] :
                     summary.healthGrade === 'C' ? [234, 179, 8] : [220, 38, 38];
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(`Grade: ${summary.healthGrade}`, 145, currentY + 12);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Risk Score: ${summary.riskScore} / 100`, 145, currentY + 20);

  // Counters
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Critical Issues: ${summary.criticalCount}`, 18, currentY + 20);
  doc.text(`High Severity: ${summary.highCount}`, 60, currentY + 20);
  doc.text(`Medium Severity: ${summary.mediumCount}`, 102, currentY + 20);
  doc.text(`Low / Info: ${summary.lowCount + summary.infoCount}`, 18, currentY + 28);

  currentY += 44;

  // AI Overview Text if available
  if (summary.aiOverview) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('AI Strategic Assessment', 14, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(summary.aiOverview, 182);
    doc.text(splitText, 14, currentY);
    currentY += splitText.length * 4.5 + 8;
  }

  // Findings Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Categorized Misconfiguration Audit Findings', 14, currentY);
  currentY += 4;

  const tableRows = summary.findings.map(f => [
    f.severity.toUpperCase(),
    f.vendor.toUpperCase(),
    f.title,
    f.category.replace('_', ' ').toUpperCase(),
    f.summary
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Severity', 'Vendor', 'Finding Title', 'Category', 'Description']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 45, fontStyle: 'bold' },
      3: { cellWidth: 30 },
      4: { cellWidth: 65 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const val = data.cell.raw as string;
        if (val === 'CRITICAL') data.cell.styles.textColor = [220, 38, 38];
        else if (val === 'HIGH') data.cell.styles.textColor = [234, 88, 12];
        else if (val === 'MEDIUM') data.cell.styles.textColor = [202, 138, 4];
        else data.cell.styles.textColor = [37, 99, 235];
      }
    }
  });

  // Get y after table
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Remediation Section
  if (options.includeRemediationCommands !== false && summary.findings.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Administrator Remediation Script Guide', 14, currentY);
    currentY += 8;

    summary.findings.forEach((finding, idx) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accentColor);
      doc.text(`${idx + 1}. ${finding.title}`, 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Root Cause: ${finding.rootCause}`, 18, currentY);
      currentY += 4.5;

      finding.remediationCommands.forEach(cmd => {
        if (currentY > 245) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(15, 23, 42); // Code box dark slate
        const boxHeight = Math.max(12, cmd.cliCommands.length * 4 + 6);
        doc.roundedRect(18, currentY, 174, boxHeight, 2, 2, 'F');

        doc.setTextColor(148, 163, 184); // Light text
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);

        let codeY = currentY + 4;
        cmd.cliCommands.forEach(line => {
          doc.text(line, 22, codeY);
          codeY += 4;
        });

        currentY += boxHeight + 6;
      });

      currentY += 4;
    });
  }

  // Footer Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} - NetRoute Audit`, 105, 287, { align: 'center' });
  }

  return doc;
}
