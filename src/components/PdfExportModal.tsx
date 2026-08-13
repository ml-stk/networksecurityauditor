import React, { useState } from 'react';
import { Download, X, FileText, CheckCircle2 } from 'lucide-react';
import { AnalysisSummary } from '../types';
import { generateAuditPdf } from '../lib/pdfGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AnalysisSummary;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  summary
}) => {
  const [companyName, setCompanyName] = useState('Enterprise Network Operations');
  const [adminName, setAdminName] = useState('Network Infrastructure Team');
  const [notes, setNotes] = useState('FortiGate & Cisco Routing Misconfiguration Audit Summary Report.');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = generateAuditPdf(summary, {
          companyName,
          adminName,
          notes
        });
        doc.save(`NetRoute-Audit-Report-${Date.now()}.pdf`);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGenerating(false);
        onClose();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Export Audit Findings PDF Report</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Organization / Client Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="e.g. Acme Corp IT"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Network Administrator Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="e.g. John Doe, Lead Network Engineer"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Executive Summary Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium resize-none leading-relaxed"
              placeholder="Add additional notes or ticket reference numbers..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-2 shadow-md cursor-pointer active:scale-95"
          >
            {isGenerating ? (
              <span>Generating PDF...</span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Report PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
