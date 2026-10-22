import QRCode from 'qrcode';

export async function generateQrCode(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    return await QRCode.toDataURL(text.trim(), {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
