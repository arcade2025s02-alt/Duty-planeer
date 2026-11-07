/**
 * Duty chart data structures, date helpers, and 24-hour retention logic
 */

export interface DutyAssignment {
  day: string; // e.g. "Monday, 26 Oct"
  date: string; // "2026-10-26"
  shift: string; // e.g. "Morning Shift (08:00 - 14:00)"
  station: string; // e.g. "Main Gate / Zone A"
  assignedStaff: string; // "Shivam Kumar"
  backupStaff?: string;
  notes?: string;
}

export interface GeneratedDutyChart {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  description?: string;
  assignments: DutyAssignment[];
  csvContent: string;
  createdAt: string; // ISO string
  expiresAt: string; // 24h later ISO string
  isTemporary: boolean;
}

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return `${startDateStr} – ${endDateStr}`;
  }

  const startDay = start.getDate();
  const startMonth = months[start.getMonth()];
  const startYear = start.getFullYear();

  const endDay = end.getDate();
  const endMonth = months[end.getMonth()];
  const endYear = end.getFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
  } else if (startYear === endYear) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
  } else {
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }
}

export function isTemporaryFileExpired(createdAtMs: number, currentMs: number = Date.now()): boolean {
  return currentMs - createdAtMs >= TWENTY_FOUR_HOURS_MS;
}

export function convertAssignmentsToCsv(title: string, dateRange: string, assignments: DutyAssignment[]): string {
  const header = ['Day', 'Date', 'Shift / Time', 'Station / Location', 'Assigned Staff', 'Backup Staff', 'Notes'];
  const rows = assignments.map(a => [
    `"${(a.day || '').replace(/"/g, '""')}"`,
    `"${(a.date || '').replace(/"/g, '""')}"`,
    `"${(a.shift || '').replace(/"/g, '""')}"`,
    `"${(a.station || '').replace(/"/g, '""')}"`,
    `"${(a.assignedStaff || '').replace(/"/g, '""')}"`,
    `"${(a.backupStaff || '').replace(/"/g, '""')}"`,
    `"${(a.notes || '').replace(/"/g, '""')}"`,
  ]);

  const metaRows = [
    `"Duty Chart Title","${(title || '').replace(/"/g, '""')}"`,
    `"Schedule Period","${(dateRange || '').replace(/"/g, '""')}"`,
    `"Generated On","${new Date().toISOString()}"`,
    '',
    header.join(','),
  ];

  return metaRows.concat(rows.map(r => r.join(','))).join('\n');
}
