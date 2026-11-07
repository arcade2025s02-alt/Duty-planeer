/**
 * Google Drive URL utilities & validation
 */

export interface GoogleDriveInfo {
  isValid: boolean;
  fileId?: string;
  previewUrl?: string;
  downloadUrl?: string;
  isSharingLink: boolean;
  warning?: string;
}

export function parseGoogleDriveUrl(url: string): GoogleDriveInfo {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      isSharingLink: false,
      warning: 'URL is required.',
    };
  }

  const trimmed = url.trim();

  // Basic check for drive.google.com or docs.google.com
  const isGoogleDomain = /^https?:\/\/(drive|docs)\.google\.com\//i.test(trimmed);
  if (!isGoogleDomain) {
    return {
      isValid: false,
      isSharingLink: false,
      warning: 'Must be a valid Google Drive or Google Docs link (e.g., https://drive.google.com/file/d/...).',
    };
  }

  // Extract ID from various Google Drive URL formats:
  // 1. https://drive.google.com/file/d/FILE_ID/view...
  // 2. https://drive.google.com/open?id=FILE_ID
  // 3. https://drive.google.com/uc?id=FILE_ID
  // 4. https://docs.google.com/spreadsheets/d/FILE_ID/...
  // 5. https://docs.google.com/document/d/FILE_ID/...
  let fileId: string | undefined;

  const fileMatch = trimmed.match(/\/(?:file\/d|spreadsheets\/d|document\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    fileId = fileMatch[1];
  } else {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }

  const isSharing = /usp=sharing|usp=drive_link/i.test(trimmed) || trimmed.includes('/d/');

  if (!fileId) {
    // It's still a Google Drive link, possibly a folder or custom shortcut
    return {
      isValid: true,
      previewUrl: trimmed,
      downloadUrl: trimmed,
      isSharingLink: isSharing,
      warning: 'Notice: If this link is private, employees without explicit Google Drive permission will not be able to open it.',
    };
  }

  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  return {
    isValid: true,
    fileId,
    previewUrl,
    downloadUrl,
    isSharingLink: isSharing,
    warning: 'Permission Notice: Ensure the file sharing in Google Drive is set to "Anyone with the link can view" or your organization access. Saving the link here does not make a private file accessible to staff.',
  };
}

export function validateDriveUrlOrThrow(url: string): void {
  const result = parseGoogleDriveUrl(url);
  if (!result.isValid) {
    throw new Error(result.warning || 'Invalid Google Drive link');
  }
}
