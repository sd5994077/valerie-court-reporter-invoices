import React, { useState } from 'react';
import Image from 'next/image';

const VENMO_QR_SRC = '/assets/Val_venmo_peronal.png';

type VenmoQRCodeProps = {
  hideCaption?: boolean;
  sizePx?: number;
  tight?: boolean; // remove inner padding so QR fills the wrapper
};

export function VenmoQRCode({ hideCaption = false, sizePx = 180, tight = false }: VenmoQRCodeProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`bg-white ${tight ? '' : 'p-1'} rounded-lg border-2 border-purple-200 shadow-sm`} style={{ width: sizePx + (tight ? 4 : 8), boxSizing: 'content-box' }}>
      <div className="bg-white flex items-center justify-center overflow-hidden rounded-md relative" style={{ width: sizePx, height: sizePx }}>
        {imgError ? (
          <div
            className="flex items-center justify-center border-2 border-dashed border-purple-300 text-[10px] text-gray-500 text-center p-2"
            style={{ width: sizePx, height: sizePx }}
          >
            QR not found. Add /public{VENMO_QR_SRC}
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
          <p className="text-xs text-purple-600">@valerie-deleon-80669</p>
        </div>
      )}
    </div>
  );
}
