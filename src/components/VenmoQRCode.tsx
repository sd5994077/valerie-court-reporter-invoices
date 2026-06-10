import React from 'react';

type VenmoQRCodeProps = {
  hideCaption?: boolean;
  sizePx?: number;
  tight?: boolean;
  scale?: number;
};

export function VenmoQRCode({ hideCaption = false }: VenmoQRCodeProps) {
  if (hideCaption) return null;

  return (
    <div className="text-center">
      <p className="text-xs font-medium text-purple-700">Venmo</p>
      <p className="text-xs text-purple-600">@valerie-deleon-80669</p>
    </div>
  );
}