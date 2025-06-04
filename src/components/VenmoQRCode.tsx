import React from 'react';

export function VenmoQRCode() {
  return (
    <div className="bg-white p-3 rounded-lg border-2 border-purple-200 shadow-sm">
      <div className="w-[120px] h-[120px] bg-white border-2 border-blue-600 relative overflow-hidden">
        {/* QR Code Pattern - Based on actual Venmo QR */}
        <div className="absolute inset-2 grid grid-cols-21 gap-0">
          {/* Generate QR pattern */}
          {Array.from({ length: 441 }, (_, i) => {
            const row = Math.floor(i / 21);
            const col = i % 21;
            
            // Corner squares
            const isCorner = (row < 7 && col < 7) || 
                           (row < 7 && col > 13) || 
                           (row > 13 && col < 7);
            
            // Data pattern simulation
            const isData = (row + col) % 3 === 0 || 
                          (row * col) % 7 === 0 ||
                          Math.sin(row * col) > 0.3;
            
            return (
              <div
                key={i}
                className={`w-1 h-1 ${
                  isCorner || isData ? 'bg-blue-600' : 'bg-white'
                }`}
              />
            );
          })}
        </div>
        
        {/* Corner position markers */}
        <div className="absolute top-1 left-1 w-6 h-6 border-2 border-blue-600">
          <div className="absolute top-1 left-1 w-2 h-2 bg-blue-600"></div>
        </div>
        <div className="absolute top-1 right-1 w-6 h-6 border-2 border-blue-600">
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600"></div>
        </div>
        <div className="absolute bottom-1 left-1 w-6 h-6 border-2 border-blue-600">
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-blue-600"></div>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs font-medium text-purple-700">Scan to Pay</p>
        <p className="text-xs text-purple-600">@ValerieDeLeon-CSR</p>
      </div>
    </div>
  );
} 