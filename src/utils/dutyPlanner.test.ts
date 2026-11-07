import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGoogleDriveUrl } from './googleDrive.ts';
import { formatDateRange, isTemporaryFileExpired, convertAssignmentsToCsv, TWENTY_FOUR_HOURS_MS } from './dutyChart.ts';
import { canManageUsers, canManageDutyChartLinks, canOnlyViewDutyChartLinks, isSuperAdmin, SUPER_ADMIN_EMAIL } from './permissions.ts';

test('Google Drive parser extracts file ID and builds preview and download URLs', () => {
  const driveUrl = 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9/view?usp=sharing';
  const result = parseGoogleDriveUrl(driveUrl);
  
  assert.equal(result.isValid, true);
  assert.equal(result.fileId, '1a2b3c4d5e6f7g8h9');
  assert.equal(result.previewUrl, 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9/preview');
  assert.equal(result.downloadUrl, 'https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f7g8h9');
  assert.ok(result.warning?.includes('Permission Notice'));
});

test('Google Drive parser handles id query parameter format', () => {
  const idUrl = 'https://drive.google.com/open?id=xyz987abc123';
  const result = parseGoogleDriveUrl(idUrl);
  
  assert.equal(result.isValid, true);
  assert.equal(result.fileId, 'xyz987abc123');
  assert.equal(result.downloadUrl, 'https://drive.google.com/uc?export=download&id=xyz987abc123');
});

test('Google Drive parser rejects invalid domains', () => {
  const invalidUrl = 'https://malicious-site.com/file/d/12345';
  const result = parseGoogleDriveUrl(invalidUrl);
  
  assert.equal(result.isValid, false);
});

test('formatDateRange formats dates properly matching prompt requirement', () => {
  const formatted = formatDateRange('2026-10-25', '2026-10-31');
  assert.equal(formatted, '25 October – 31 October 2026');
});

test('isTemporaryFileExpired verifies 24-hour temporary file deletion requirement', () => {
  const now = 1792900000000;
  const recent = now - (10 * 60 * 60 * 1000); // 10 hours ago
  const old = now - (25 * 60 * 60 * 1000); // 25 hours ago

  assert.equal(isTemporaryFileExpired(recent, now), false);
  assert.equal(isTemporaryFileExpired(old, now), true);
  assert.equal(TWENTY_FOUR_HOURS_MS, 86400000);
});

test('CSV conversion generates valid RFC 4180 escaped CSV rows', () => {
  const csv = convertAssignmentsToCsv('Exam Duty Week 1', '25 October – 31 October 2026', [
    {
      day: 'Monday, 26 Oct',
      date: '2026-10-26',
      shift: 'Morning Shift',
      station: 'Hall "A"',
      assignedStaff: 'Rahul Sharma',
      backupStaff: 'Anita Roy',
      notes: 'Supervision duty',
    }
  ]);

  assert.ok(csv.includes('"Duty Chart Title","Exam Duty Week 1"'));
  assert.ok(csv.includes('"Hall ""A"""'));
  assert.ok(csv.includes('"Rahul Sharma"'));
});

test('Role permissions enforce Super Admin, Admin, and Employee boundaries', () => {
  // Super Admin checks
  assert.equal(isSuperAdmin({ email: SUPER_ADMIN_EMAIL, role: 'super_admin' }), true);
  assert.equal(canManageUsers('super_admin'), true);
  assert.equal(canManageUsers('admin'), false);
  assert.equal(canManageUsers('employee'), false);

  // Link management
  assert.equal(canManageDutyChartLinks('super_admin'), true);
  assert.equal(canManageDutyChartLinks('admin'), true);
  assert.equal(canManageDutyChartLinks('employee'), false);

  // Employee read-only boundary
  assert.equal(canOnlyViewDutyChartLinks('employee'), true);
  assert.equal(canOnlyViewDutyChartLinks('admin'), false);
});
