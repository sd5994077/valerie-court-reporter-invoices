import React from 'react';

type VenmoQRCodeProps = {
  hideCaption?: boolean;
  sizePx?: number;
};

export function VenmoQRCode({ hideCaption = false, sizePx = 180 }: VenmoQRCodeProps) {
  const qrSrc = "/assets/Venmo-Val.jpg"; // Use existing JPG in public/assets
  return (
    <div className="bg-white p-1 rounded-lg border-2 border-purple-200 shadow-sm" style={{ width: sizePx + 8, boxSizing: 'content-box' }}>
      <div className="bg-white flex items-center justify-center overflow-hidden rounded-md" style={{ width: sizePx, height: sizePx }}>
        <img
          src={qrSrc}
          alt="Venmo QR Code"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Try alternate extension once before showing fallback message
            if (target.dataset.altTried !== '1') {
              target.dataset.altTried = '1';
              const isJpg = target.src.endsWith('Venmo-Val.jpg');
              target.src = isJpg ? '/assets/Venmo-Val.png' : '/assets/Venmo-Val.jpg';
              return;
            }
            target.style.display = 'none';
            const fallback = target.parentElement;
            if (fallback) {
              fallback.innerHTML = `<div style="width:${sizePx}px;height:${sizePx}px" class="flex items-center justify-center border-2 border-dashed border-purple-300 text-[10px] text-gray-500 text-center p-2">QR not found. Add /public/assets/Venmo-Val.jpg or Venmo-Val.png</div>`;
            }
          }}
        />
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