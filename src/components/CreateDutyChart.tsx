import React, { useState } from 'react';
import { 
  Sparkles, Upload, FileText, Download, CheckCircle, 
  Clock, ShieldAlert, ArrowRight, RefreshCw, AlertCircle, FileSpreadsheet, Trash2, Edit3 
} from 'lucide-react';
import { DutyAssignment } from '../utils/dutyChart.ts';
import { UserProfile } from '../utils/permissions.ts';

interface CreateDutyChartProps {
  currentUser: UserProfile | null;
  onNavigateToList: () => void;
}

export const CreateDutyChart: React.FC<CreateDutyChartProps> = ({
  currentUser: _currentUser,
  onNavigateToList,
}) => {
  const [title, setTitle] = useState('Duty Chart | 25 October – 31 October 2026');
  const [startDate, setStartDate] = useState('2026-10-25');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [instructions, setInstructions] = useState(
    'Ensure 2 staff per station. Rotate morning and evening shifts fairly. Keep minimum 1 senior supervisor on duty each shift.'
  );

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    content: string;
    size: number;
  } | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedChart, setGeneratedChart] = useState<{
    chartId: string;
    title: string;
    startDate: string;
    endDate: string;
    formattedDateRange: string;
    assignments: DutyAssignment[];
    csvContent: string;
    expiresAt: string;
    downloadUrl: string;
  } | null>(null);

  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [tempDeleted, setTempDeleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File handler for CSV, PDF, Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
    const isAllowed = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      alert('Supported file types: Excel (.xlsx, .xls), CSV (.csv), or PDF (.pdf).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setUploadedFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        content: content.slice(0, 15000), // excerpt for context
        size: file.size,
      });
    };

    if (file.type.includes('text') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      alert('Please fill out Title, Start Date, and End Date.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setHasDownloaded(false);
    setTempDeleted(false);

    try {
      const response = await fetch('/api/generate-duty-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          startDate,
          endDate,
          instructions,
          previousChart: uploadedFile
            ? {
                name: uploadedFile.name,
                type: uploadedFile.type,
                content: uploadedFile.content,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate duty chart.');
      }

      const data = await response.json();
      setGeneratedChart(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while contacting Intelligent Duty Planner.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignmentChange = (index: number, field: keyof DutyAssignment, val: string) => {
    if (!generatedChart) return;
    const updated = [...generatedChart.assignments];
    updated[index] = { ...updated[index], [field]: val };
    setGeneratedChart({
      ...generatedChart,
      assignments: updated,
    });
  };

  const handleDownload = () => {
    if (!generatedChart) return;

    // Trigger local download of CSV
    const blob = new Blob([generatedChart.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duty-chart-${generatedChart.startDate}-to-${generatedChart.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
  };

  const handleConfirmPermanentBackupAndClear = async () => {
    if (!generatedChart) return;
    try {
      await fetch(`/api/temp-file/${generatedChart.chartId}`, { method: 'DELETE' });
      setTempDeleted(true);
    } catch (err) {
      console.warn('Failed to prune temp file:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Intelligent Duty Chart Planner
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Assisted
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Enter shift parameters, upload historical rosters, and let the Intelligent Duty Planner generate an optimal duty schedule.
          Review the generated draft and download it for publishing to your organization&apos;s Google Drive.
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duty Chart Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Duty Chart | 25 October – 31 October 2026"
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preset Range
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('2026-10-25');
                    setEndDate('2026-10-31');
                    setTitle('Duty Chart | 25 October – 31 October 2026');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex-1"
                >
                  25–31 Oct 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('2026-11-01');
                    setEndDate('2026-11-07');
                    setTitle('Duty Chart | 01 November – 07 November 2026');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex-1"
                >
                  01–07 Nov 2026
                </button>
              </div>
            </div>
          </div>

          {/* Description & Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Instructions & Allocation Rules
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Ensure minimum 2 staff per station, keep Rahul Sharma on Morning Shift, rotate Sunday shifts..."
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Upload Previous Duty Chart (Excel, CSV, PDF) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Upload Previous Duty Chart (Excel, CSV, or PDF)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="chart-file-upload"
                accept=".csv, .xlsx, .xls, .pdf, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="chart-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {uploadedFile ? uploadedFile.name : 'Click to upload previous duty chart or drag and drop'}
                </div>
                <p className="text-xs text-slate-500">
                  Supports Excel (.xlsx, .xls), CSV (.csv), or PDF (.pdf) documents
                </p>
              </label>

              {uploadedFile && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Loaded {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="ml-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Duty Chart...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Suggested Duty Chart
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Review Section (Requirement 2: Do not automatically publish an unreviewed chart) */}
      {generatedChart && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-6 p-6 sm:p-8">
          {/* Review Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Unpublished Draft &bull; Review Required
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Server temp copy expires in 24 hours
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{generatedChart.title}</h2>
              <p className="text-xs text-slate-600">{generatedChart.formattedDateRange}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Reviewed Chart (.CSV)
              </button>
            </div>
          </div>

          {/* Notice: Requirement 2 & 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Admin Review Discipline</span>
              </div>
              <p>
                This chart is <strong>not automatically published</strong>. You can inspect or tweak any duty post assignment below, then download the file.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Temporary File &amp; Cache Policy</span>
              </div>
              <p>
                Server-side generated temporary files are automatically purged within 24 hours. Google Drive links added to the ERP remain permanent and are never automatically deleted.
              </p>
            </div>
          </div>

          {/* Interactive Review Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Day &amp; Date</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Station / Post</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Backup / Reliever</th>
                  <th className="py-3 px-4">Duty Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedChart.assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {assignment.day}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={assignment.shift}
                        onChange={(e) => handleAssignmentChange(idx, 'shift', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={assignment.station}
                        onChange={(e) => handleAssignmentChange(idx, 'station', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <input
                        type="text"
                        value={assignment.assignedStaff}
                        onChange={(e) => handleAssignmentChange(idx, 'assignedStaff', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-blue-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-blue-50/30"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <input
                        type="text"
                        value={assignment.backupStaff || ''}
                        onChange={(e) => handleAssignmentChange(idx, 'backupStaff', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <input
                        type="text"
                        value={assignment.notes || ''}
                        onChange={(e) => handleAssignmentChange(idx, 'notes', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Post-Download Action / Next Steps Guide */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Next Step: Publish to Google Drive
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  ERP workflow for Google Drive distribution:
                </p>
              </div>

              {hasDownloaded && !tempDeleted && (
                <button
                  onClick={handleConfirmPermanentBackupAndClear}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                >
                  Confirm Download &amp; Clear Server Temp Copy
                </button>
              )}
              {tempDeleted && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Server temp copy cleared
                </span>
              )}
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">1. Download Chart</span>
                Save the reviewed CSV file to your local drive.
              </li>
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">2. Upload to Google Drive</span>
                Upload to your company Google Drive and set sharing to &ldquo;Anyone with link can view&rdquo;.
              </li>
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">3. Add to Current List</span>
                Paste the shareable link in the Current Duty Chart List menu.
              </li>
            </ol>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onNavigateToList}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                Go to Current Duty Chart List
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
