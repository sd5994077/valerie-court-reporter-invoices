'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { VENMO_HANDLE, VENMO_QR_SRC } from '../config/venmo';

type VenmoQRCodeProps = {
  hideCaption?: boolean;
  sizePx?: number;
  tight?: boolean; // remove inner padding so QR fills the wrapper
};

export function VenmoQRCode({ hideCaption = false, sizePx = 180, tight = false }: VenmoQRCodeProps) {
  const [imgError, setImgError] = useState(false);
  const frameWidth = sizePx + (tight ? 0 : 8) + 4; // QR + padding (p-1) + border (2px each side)

  return (
    <div className={`bg-white ${tight ? '' : 'p-1'} rounded-lg border-2 border-purple-200 shadow-sm`} style={{ width: frameWidth, boxSizing: 'border-box' }}>
      <div className="bg-white flex items-center justify-center overflow-hidden rounded-md relative" style={{ width: sizePx, height: sizePx }}>
        {imgError ? (
          <div className="flex flex-col items-center justify-center text-center text-purple-700" style={{ width: sizePx, height: sizePx }}>
            <p className="text-xs font-medium">Venmo</p>
            <p className="text-xs">{VENMO_HANDLE}</p>
          </div>
        ) : (
          <Image
            src={VENMO_QR_SRC}
            alt="Venmo QR Code"
            width={sizePx}
            height={sizePx}
            className="object-contain"
            style={{ width: sizePx, height: sizePx }}
            onError={() => setImgError(true)}
            unoptimized
          />
        )}
      </div>
      {!hideCaption && (
        <div className="text-center mt-2">
          <p className="text-xs font-medium text-purple-700">Scan to Pay</p>
          <p className="text-xs text-purple-600">{VENMO_HANDLE}</p>
        </div>
      )}
    </div>
  );
}
