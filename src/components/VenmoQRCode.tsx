import React, { useState } from 'react';
import Image from 'next/image';

type VenmoQRCodeProps = {
  hideCaption?: boolean;
  sizePx?: number;
  tight?: boolean; // remove inner padding so QR fills the wrapper
  scale?: number; // scale image inside container to reduce white margins
};

export function VenmoQRCode({ hideCaption = false, sizePx = 180, tight = false, scale = 1 }: VenmoQRCodeProps) {
  const [imgSrc, setImgSrc] = useState("/assets/Venmo-Val.jpg");
  const [imgError, setImgError] = useState(false);
  const [altTried, setAltTried] = useState(false);

  const handleError = () => {
    if (!altTried) {
      setAltTried(true);
      const isJpg = imgSrc.endsWith('Venmo-Val.jpg');
      setImgSrc(isJpg ? '/assets/Venmo-Val.png' : '/assets/Venmo-Val.jpg');
    } else {
      setImgError(true);
    }
  };

  return (
    <div className={`bg-white ${tight ? '' : 'p-1'} rounded-lg border-2 border-purple-200 shadow-sm`} style={{ width: sizePx + (tight ? 4 : 8), boxSizing: 'content-box' }}>
      <div className="bg-white flex items-center justify-center overflow-hidden rounded-md relative" style={{ width: sizePx, height: sizePx }}>
        {imgError ? (
          <div 
            className="flex items-center justify-center border-2 border-dashed border-purple-300 text-[10px] text-gray-500 text-center p-2"
            style={{ width: sizePx, height: sizePx }}
          >
            QR not found. Add /public/assets/Venmo-Val.jpg or Venmo-Val.png
          </div>
        ) : (
          <Image
            src={imgSrc}
            alt="Venmo QR Code"
            width={sizePx}
            height={sizePx}
            className="object-cover"
            style={{ transform: `scale(${scale})` }}
            onError={handleError}
            unoptimized
          />
        )}
      </div>
      {!hideCaption && (
        <div className="text-center mt-2">
          <p className="text-xs font-medium text-purple-700">Scan to Pay</p>
          <p className="text-xs text-purple-600">@ValerieDeLeon-CSR</p>
        </div>
      )}
    </div>
  );
}