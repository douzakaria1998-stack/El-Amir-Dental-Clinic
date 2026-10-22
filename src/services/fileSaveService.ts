import type { ClinicSettings } from '../types/settings';
import { settingsRepository } from '../storage/settingsRepository';

export type SaveResult =
  | { success: true; method: 'desktop' }
  | { success: true; method: 'folder'; folderName: string }
  | { success: true; method: 'download'; reason?: string }
  | { success: false; cancelled: true }
  | { success: false; error: Error };

/**
 * Checks whether the File System Access API is supported.
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Checks whether Directory Picker is supported.
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Saves a PDF blob according to the configured method and browser support.
 */
export async function savePdfFile(
  blob: Blob,
  fileName: string,
  settings: ClinicSettings,
  objectUrlFallback?: string
): Promise<SaveResult> {
  // 1. If method is 'folder', try to use remembered DirectoryHandle
  if (settings.saveMethod === 'folder') {
    try {
      const dirHandle = await settingsRepository.getSaveFolder();
      if (dirHandle) {
        // Verify / request permission
        let perm = await (dirHandle as any).queryPermission?.({ mode: 'readwrite' });
        if (perm !== 'granted' && (dirHandle as any).requestPermission) {
          perm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        }
        if (perm === 'granted') {
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return { success: true, method: 'folder', folderName: dirHandle.name };
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('Folder save failed, falling back to dialog or download', err);
    }
  }

  // 2. If showSaveFilePicker is available (Chrome, Edge, Opera)
  if (settings.saveMethod !== 'download' && isFileSystemAccessSupported()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        startIn: 'desktop',
        types: [
          {
            description: 'PDF Document (*.pdf)',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, method: 'desktop' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('File picker failed or refused, falling back to download', err);
    }
  }

  // 3. Fallback: Browser download anchor
  try {
    const url = objectUrlFallback || URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (!objectUrlFallback) {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    return {
      success: true,
      method: 'download',
      reason: !isFileSystemAccessSupported() ? 'unsupported' : 'fallback',
    };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
