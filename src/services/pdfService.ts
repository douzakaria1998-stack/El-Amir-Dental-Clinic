import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface GeneratedPdf {
  blob: Blob;
  dataUrl: string;
  objectUrl: string;
}

/**
 * Generates an A4 PDF from the rendered invoice DOM elements.
 * Captures each `.inv-page` at high resolution (scale ~2.5) to ensure crisp
 * typography, perfect Arabic script shaping (RTL) and identical visual layout.
 */
export async function generateInvoicePdf(containerElement: HTMLElement): Promise<GeneratedPdf> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Find all individual pages inside container, or use the container itself if it is a page
  const pageElements = Array.from(
    containerElement.querySelectorAll<HTMLElement>('.inv-page')
  );
  const elementsToCapture = pageElements.length > 0 ? pageElements : [containerElement];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < elementsToCapture.length; i++) {
    const el = elementsToCapture[i];
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Capture using html-to-image
    const imgDataUrl = await toPng(el, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#ffffff',
      // skip foreign objects if needed or preserve layout
      style: {
        transform: 'none',
        margin: '0',
      },
    });

    doc.addImage(imgDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const objectUrl = URL.createObjectURL(blob);

  return { blob, dataUrl, objectUrl };
}
