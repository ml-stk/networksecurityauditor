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
  doc.text('STK ApplianceSentry Audit', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Multi-Vendor Firewall, VPN & Routing Analysis', 14, 25);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${reportDate}`, 155, 25);

  currentY = 40;

  // Metadata Card - REFIXED FOR VERTICAL ALIGNMENT (No more overlap)
  if (options.companyName || options.adminName || options.notes) {
    const metaX = 18;
    const contentWidth = 174; // 182 - margins
    
    // Calculate required height
    let requiredHeight = 10; // padding
    if (options.companyName) requiredHeight += 6;
    if (options.adminName) requiredHeight += 6;
    
    let splitNotes: string[] = [];
    if (options.notes) {
      splitNotes = doc.splitTextToSize(`Notes: ${options.notes}`, contentWidth);
      requiredHeight += (splitNotes.length * 5) + 2;
    }

    // Draw Box
    doc.setFillColor(...lightBg);
    doc.roundedRect(14, currentY, 182, requiredHeight, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, requiredHeight, 3, 3, 'D');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    let textY = currentY + 7;

    if (options.companyName) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Organization: ${options.companyName}`, metaX, textY);
      textY += 6;
    }
    if (options.adminName) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Administrator: ${options.adminName}`, metaX, textY);
      textY += 6;
    }
    if (options.notes) {
      doc.setFont('helvetica', 'normal');
      doc.text(splitNotes, metaX, textY);
      textY += (splitNotes.length * 5);
    }

    currentY += requiredHeight + 10;
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

  // AI Assessment
  if (summary.aiOverview) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('Strategic Security Assessment', 14, currentY);
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
  doc.text('Categorized Audit Findings', 14, currentY);
  currentY += 4;

  const tableRows = summary.findings.map(f => [
    f.severity.toUpperCase(),
    f.deviceName,
    f.title,
    f.category.replace('_', ' ').toUpperCase(),
    f.description
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Severity', 'Device', 'Finding Title', 'Category', 'Description']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: 62 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const val = data.cell.raw as string;
        if (val === 'CRITICAL') data.cell.styles.textColor = [220, 38, 38];
        else if (val === 'HIGH') data.cell.styles.textColor = [234, 88, 12];
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Remediation Guide
  if (options.includeRemediationCommands !== false && summary.findings.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Remediation Script & Fix Guide', 14, currentY);
    currentY += 8;

    summary.findings.forEach((finding, idx) => {
      if (!finding.remediation) return;
      
      if (currentY > 230) { doc.addPage(); currentY = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accentColor);
      doc.text(`${idx + 1}. ${finding.title}`, 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Impact: ${finding.impact || 'Potential security or connectivity risk.'}`, 18, currentY);
      currentY += 6;

      const codeLines = doc.splitTextToSize(finding.remediation, 160);
      const boxHeight = (codeLines.length * 4) + 6;
      
      if (currentY + boxHeight > 270) { doc.addPage(); currentY = 20; }

      doc.setFillColor(15, 23, 42); 
      doc.roundedRect(18, currentY, 174, boxHeight, 1, 1, 'F');
      
      doc.setTextColor(148, 163, 184);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      
      doc.text(codeLines, 22, currentY + 4);
      
      currentY += boxHeight + 8;
      doc.setFont('helvetica', 'normal');
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} - STK ApplianceSentry Audit Report`, 105, 287, { align: 'center' });
  }

  return doc;
}