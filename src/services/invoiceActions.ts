import type { TFunction } from 'i18next';
import type { Invoice } from '../types/invoice';
import type { ClinicSettings } from '../types/settings';
import { invoiceRepository } from '../storage/invoiceRepository';
import { validateInvoice, hasErrors } from '../utils/validation';
import { invoiceFileName } from '../utils/fileName';
import { generateInvoicePdf } from './pdfService';
import { savePdfFile } from './fileSaveService';
import { printPdfBlob } from './printService';

export interface ActionFeedback {
  success: boolean;
  savedInvoice?: Invoice;
  error?: string;
}

export async function executeInvoiceAction({
  invoice,
  settings,
  previewElement,
  action,
  t,
  showSnackbar,
  showError,
  onInvoiceSaved,
}: {
  invoice: Invoice;
  settings: ClinicSettings;
  previewElement: HTMLElement | null;
  action: 'print' | 'pdfOnly' | 'saveOnly';
  t: TFunction;
  showSnackbar: (msg: string, sev?: 'success' | 'info' | 'warning' | 'error') => void;
  showError: (msg: string) => void;
  onInvoiceSaved?: (saved: Invoice) => void;
}): Promise<ActionFeedback> {
  // 1. Validation
  const errors = validateInvoice(invoice);
  if (hasErrors(errors)) {
    showError(t('validation.formInvalid'));
    return { success: false, error: 'validation-failed' };
  }

  // 2. Save invoice to repository / history
  let saved: Invoice;
  try {
    saved = await invoiceRepository.save(invoice);
    if (onInvoiceSaved) {
      onInvoiceSaved(saved);
    }
  } catch (err: any) {
    showError(t('snackbar.error', { message: err?.message || 'Save error' }));
    return { success: false, error: 'save-failed' };
  }

  if (action === 'saveOnly') {
    showSnackbar(t('snackbar.saved', { number: saved.number }), 'success');
    return { success: true, savedInvoice: saved };
  }

  // Check preview element
  if (!previewElement) {
    showError(t('snackbar.error', { message: 'Preview element not ready' }));
    return { success: false, error: 'preview-not-ready' };
  }

  // 3. Generate high-res PDF
  let pdfResult;
  try {
    pdfResult = await generateInvoicePdf(previewElement);
  } catch (err: any) {
    showError(t('snackbar.error', { message: 'PDF generation failed: ' + (err?.message || '') }));
    return { success: false, error: 'pdf-generation-failed' };
  }

  const fileName = invoiceFileName(saved);

  // 4. Save PDF to Desktop / Folder / Download
  const saveResult = await savePdfFile(pdfResult.blob, fileName, settings, pdfResult.objectUrl);

  if (!saveResult.success) {
    if ('cancelled' in saveResult && saveResult.cancelled) {
      showSnackbar(t('snackbar.cancelled'), 'info');
      return { success: false, error: 'cancelled' };
    } else {
      showError(t('snackbar.error', { message: 'File save failed' }));
      return { success: false, error: 'file-save-failed' };
    }
  }

  // 5. If action is print, open print dialog
  if (action === 'print') {
    try {
      await printPdfBlob(pdfResult.blob, pdfResult.objectUrl);
    } catch (err) {
      console.warn('Direct PDF print dialog failed', err);
    }

    // Snackbar message for print
    if (saveResult.method === 'desktop') {
      showSnackbar(t('snackbar.savedDesktopPrint'), 'success');
    } else if (saveResult.method === 'folder') {
      showSnackbar(t('snackbar.savedFolderPrint', { folder: saveResult.folderName }), 'success');
    } else {
      showSnackbar(t('snackbar.downloadedPrint'), 'info');
    }
  } else {
    // PDF only
    if (saveResult.method === 'desktop') {
      showSnackbar(t('snackbar.savedDesktop'), 'success');
    } else if (saveResult.method === 'folder') {
      showSnackbar(t('snackbar.savedFolder', { folder: saveResult.folderName }), 'success');
    } else {
      showSnackbar(t('snackbar.downloaded'), 'info');
    }
  }

  return { success: true, savedInvoice: saved };
}
