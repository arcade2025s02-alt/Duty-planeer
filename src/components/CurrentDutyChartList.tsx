import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, ExternalLink, Download, Eye, 
  AlertTriangle, Shield, CheckCircle2, Edit2, Trash2, Calendar
} from 'lucide-react';
import { DutyChartLinkRecord, supabaseService } from '../lib/supabase.ts';
import { UserProfile, canManageDutyChartLinks } from '../utils/permissions.ts';
import { parseGoogleDriveUrl } from '../utils/googleDrive.ts';
import { formatDateRange } from '../utils/dutyChart.ts';
import { DrivePreviewModal } from './DrivePreviewModal.tsx';

interface CurrentDutyChartListProps {
  currentUser: UserProfile | null;
  onNavigateToCreate?: () => void;
}

export const CurrentDutyChartList: React.FC<CurrentDutyChartListProps> = ({
  currentUser,
  onNavigateToCreate,
}) => {
  const [links, setLinks] = useState<DutyChartLinkRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal states for adding/editing a link
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState<string>('2026-10-25');
  const [endDateInput, setEndDateInput] = useState<string>('2026-10-31');
  const [driveLinkInput, setDriveLinkInput] = useState<string>('');
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; warning?: string }>({ isValid: true });

  // Preview Modal
  const [previewTarget, setPreviewTarget] = useState<DutyChartLinkRecord | null>(null);

  const canEdit = canManageDutyChartLinks(currentUser?.role);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await supabaseService.listDutyChartLinks();
      setLinks(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load duty chart links.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setDriveLinkInput(url);
    if (!url.trim()) {
      setUrlValidation({ isValid: false, warning: 'Google Drive URL is required.' });
      return;
    }
    const parsed = parseGoogleDriveUrl(url);
    setUrlValidation({
      isValid: parsed.isValid,
      warning: parsed.warning,
    });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitleInput(`Duty Chart | 25 October – 31 October 2026`);
    setStartDateInput('2026-10-25');
    setEndDateInput('2026-10-31');
    setDriveLinkInput('');
    setUrlValidation({ isValid: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: DutyChartLinkRecord) => {
    setEditingId(record.id);
    setTitleInput(record.title);
    setStartDateInput(record.start_date);
    setEndDateInput(record.end_date);
    setDriveLinkInput(record.drive_link);
    handleUrlChange(record.drive_link);
    setIsModalOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Access Denied: Employees cannot create or edit duty chart links.');
      return;
    }

    if (!titleInput.trim()) {
      alert('Duty Chart Title is required.');
      return;
    }

    const validation = parseGoogleDriveUrl(driveLinkInput);
    if (!validation.isValid) {
      alert(validation.warning || 'Please provide a valid Google Drive URL.');
      return;
    }

    try {
      if (editingId) {
        await supabaseService.updateDutyChartLink(editingId, {
          title: titleInput,
          startDate: startDateInput,
          endDate: endDateInput,
          driveLink: driveLinkInput,
        });
      } else {
        await supabaseService.addDutyChartLink({
          title: titleInput,
          startDate: startDateInput,
          endDate: endDateInput,
          driveLink: driveLinkInput,
        });
      }
      setIsModalOpen(false);
      await loadLinks();
    } catch (err: any) {
      alert(err.message || 'Error saving duty chart link.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!canEdit) return;
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await supabaseService.deleteDutyChartLink(id);
      await loadLinks();
    } catch (err: any) {
      alert(err.message || 'Error deleting link.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Role Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Current Duty Chart List
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Roster
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Access authorized duty charts stored securely on Google Drive.
          </p>
        </div>

        {/* Action Button for Admin & Super Admin */}
        {canEdit && (
          <div className="flex items-center gap-3">
            {onNavigateToCreate && (
              <button
                onClick={onNavigateToCreate}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Planner AI
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Duty Chart Link
            </button>
          </div>
        )}
      </div>

      {/* Role Restriction Banner for Employees */}
      {!canEdit && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong>Employee View Access:</strong> You are logged in as an Employee. You can view and download active duty charts. 
            Super Admin and authorized Admin users manage official Google Drive links in the database.
          </div>
        </div>
      )}

      {/* Security notice regarding Google Drive URLs (Requirement 5) */}
      <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Google Drive Sharing Notice:</strong> Storing a URL in this ERP does not alter its Google Drive privacy settings. 
          If a chart is not opening for you, ensure the Admin has enabled appropriate access (e.g., &ldquo;Anyone with the link can view&rdquo; or organization domain access) inside Google Drive.
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Content Table / Cards */}
      <div className="mt-6 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading current duty chart list...
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold text-base">No Duty Charts Available</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
              There are currently no active duty chart links recorded in the system.
            </p>
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
              >
                Add First Duty Chart Link
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table displaying ONLY the required fields: Duty Chart Title, Start Date – End Date, Google Drive Link, View button, Download button */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Duty Chart Title</th>
                  <th className="py-3.5 px-6">Start Date – End Date</th>
                  <th className="py-3.5 px-6">Google Drive Link</th>
                  <th className="py-3.5 px-6 text-center">View</th>
                  <th className="py-3.5 px-6 text-center">Download</th>
                  {canEdit && <th className="py-3.5 px-6 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {links.map((link) => {
                  const dateRange = formatDateRange(link.start_date, link.end_date);
                  const parsed = parseGoogleDriveUrl(link.drive_link);
                  const downloadHref = parsed.downloadUrl || link.drive_link;

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Field 1: Duty Chart Title */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block">{link.title}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              Added by {link.created_by_email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Field 2: Start Date – End Date */}
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium">
                          {dateRange}
                        </span>
                      </td>

                      {/* Field 3: Google Drive Link */}
                      <td className="py-4 px-6">
                        <a
                          href={link.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline max-w-[200px] sm:max-w-xs truncate"
                          title={link.drive_link}
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>Open Duty Chart</span>
                        </a>
                      </td>

                      {/* Field 4: View button */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setPreviewTarget(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          title="View preview of duty chart"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>

                      {/* Field 5: Download button */}
                      <td className="py-4 px-6 text-center">
                        <a
                          href={downloadHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                          title="Download linked duty chart"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </td>

                      {/* Admin Actions (Edit/Delete - Super Admin & Admin only) */}
                      {canEdit && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(link)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                            title="Edit Link"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id, link.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Duty Chart Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingId ? 'Edit Duty Chart Link' : 'Add New Duty Chart Link'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload the file to your Google Drive, obtain its shareable link, and record it here.
            </p>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duty Chart Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Duty Chart | 25 October – 31 October 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Drive Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={driveLinkInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 ${
                    urlValidation.isValid ? 'border-slate-300 focus:ring-blue-500' : 'border-red-400 focus:ring-red-500'
                  }`}
                />
                {urlValidation.warning && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md mt-1.5 border border-amber-200">
                    {urlValidation.warning}
                  </p>
                )}
              </div>

              {/* Requirement 5: Strict Sharing Warning */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive Access Requirement</span>
                </div>
                <p>
                  1. In Google Drive, click <strong>Share</strong> on the file.
                </p>
                <p>
                  2. Set General Access to <strong>&ldquo;Anyone with the link&rdquo;</strong> (Viewer) or your organization domain.
                </p>
                <p className="text-amber-700 font-medium">
                  Warning: Anyone with the link will be able to access the file. If set to private, employees will not have access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!urlValidation.isValid}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingId ? 'Update Link' : 'Save Duty Chart Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drive Preview Modal */}
      {previewTarget && (
        <DrivePreviewModal
          title={previewTarget.title}
          driveLink={previewTarget.drive_link}
          dateRange={formatDateRange(previewTarget.start_date, previewTarget.end_date)}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </div>
  );
};
