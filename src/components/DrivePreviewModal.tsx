import React from 'react';
import { X, ExternalLink, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import { parseGoogleDriveUrl } from '../utils/googleDrive.ts';

interface DrivePreviewModalProps {
  title: string;
  driveLink: string;
  dateRange: string;
  onClose: () => void;
}

export const DrivePreviewModal: React.FC<DrivePreviewModalProps> = ({
  title,
  driveLink,
  dateRange,
  onClose,
}) => {
  const parsed = parseGoogleDriveUrl(driveLink);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">{dateRange}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={parsed.downloadUrl || driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Drive
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security / Permissions Warning Card (Requirement 5) */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Access Note:</strong> Google Drive permissions govern file access. Storing a link in this ERP does not bypass Google Drive privacy settings. If you cannot view this preview, request access from the document owner or Admin.
          </span>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-slate-100 relative">
          {parsed.previewUrl ? (
            <iframe
              src={parsed.previewUrl}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <ShieldCheck className="w-12 h-12 text-blue-500 mb-3" />
              <p className="text-slate-800 font-medium">Duty chart document link is ready.</p>
              <p className="text-slate-500 text-sm max-w-md mt-1 mb-4">
                Click below to open the duty chart directly in your Google Drive viewer.
              </p>
              <a
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Duty Chart in Google Drive
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Duty Planner ERP &bull; Linked via Google Drive</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
