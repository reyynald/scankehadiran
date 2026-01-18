'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QrCodeProps {
  value: string;
  size?: number;
  downloadFileName?: string;
}

export function QrCode({ value, size = 250, downloadFileName = 'qr-code' }: QrCodeProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    value
  )}&size=${size}x${size}&bgcolor=F0F2FA&color=111827`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanFileName = downloadFileName.replace(/\s+/g, '_').toLowerCase();
      link.download = `${cleanFileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Gagal mengunduh kode QR.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src={qrUrl}
        alt={`Kode QR untuk sesi`}
        width={size}
        height={size}
        className="rounded-lg border bg-white p-2"
        priority
      />
      {downloadFileName && (
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2" />
          Unduh Kode QR
        </Button>
      )}
    </div>
  );
}
