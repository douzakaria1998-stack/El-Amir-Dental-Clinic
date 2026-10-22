/**
 * Triggers printing of a generated PDF blob using a hidden iframe,
 * or direct window.print() fallback.
 */
export async function printPdfBlob(blob: Blob, objectUrl?: string): Promise<boolean> {
  const url = objectUrl || URL.createObjectURL(blob);

  return new Promise<boolean>((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          if (!objectUrl) {
            URL.revokeObjectURL(url);
          }
        }, 60000); // give enough time for the print dialog
      };

      iframe.onload = () => {
        try {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              cleanup();
              resolve(true);
            } else {
              fallback();
            }
          }, 300);
        } catch (err) {
          console.warn('Iframe print error, falling back', err);
          fallback();
        }
      };

      const fallback = () => {
        try {
          const w = window.open(url, '_blank');
          if (w) {
            w.focus();
            setTimeout(() => {
              try {
                w.print();
              } catch {
                /* ignore */
              }
            }, 500);
            cleanup();
            resolve(true);
          } else {
            // Popup blocked: do direct browser window print
            window.print();
            cleanup();
            resolve(true);
          }
        } catch {
          window.print();
          cleanup();
          resolve(true);
        }
      };

      iframe.onerror = fallback;
      document.body.appendChild(iframe);
    } catch (err) {
      console.warn('Print initiation failed, invoking window.print', err);
      window.print();
      resolve(true);
    }
  });
}

/**
 * Direct print trigger for preview dialogs or keyboard shortcuts
 */
export function printDirect(): void {
  window.print();
}
