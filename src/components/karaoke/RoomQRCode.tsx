"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface RoomQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export default function RoomQRCode({
  value,
  size = 180,
  className = "",
  alt = "QR code",
}: RoomQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#09090b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`grid place-items-center rounded-[var(--radius-xs)] border border-border-default bg-white ${className}`}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Generating QR code"
      >
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-800 border-t-transparent" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={alt}
      className={`block h-auto rounded-[var(--radius-xs)] ${className}`}
      style={{ width: size }}
    />
  );
}
