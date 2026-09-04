import api from './api';
import type { TypedWord } from '../types';

interface CertificateConfigResponse {
  durationSeconds: number;
}

export interface GuestCertificatePayload {
  startTime: string;
  endTime: string;
  recipientName: string;
  typedWords: TypedWord[];
}

/** Public config — how long a certificate test runs (admin-configurable). */
export async function getCertificateConfig(): Promise<number> {
  const { data } = await api.get('/certificates/config');
  const seconds = (data.data as CertificateConfigResponse).durationSeconds;
  return typeof seconds === 'number' && seconds >= 30 && seconds <= 900 ? seconds : 60;
}

/**
 * Send the raw keystroke record for one-time server verification + PDF
 * generation. Nothing is stored; the response IS the PDF file.
 */
export async function downloadGuestCertificate(payload: GuestCertificatePayload): Promise<void> {
  const response = await api.post('/certificates/guest', payload, {
    responseType: 'blob',
    timeout: 30000,
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Typeoye-Certificate.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
