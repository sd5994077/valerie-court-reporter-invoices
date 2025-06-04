import React from 'react';

export function SignatureImage() {
  return (
    <div>
      {/* Add Google Fonts link for PDF generation */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>
      
      <div style={{ 
        fontFamily: "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
        fontSize: "52px",
        lineHeight: "1.2",
        marginBottom: "8px",
        color: "#7c3aed",
        fontWeight: "400",
        letterSpacing: "0.5px",
        minHeight: "65px"
      }}>
        Valerie De Leon
      </div>
      <div style={{ 
        margin: 0,
        fontSize: "13px",
        color: "#6b7280",
        fontWeight: "500",
        letterSpacing: "0.25px",
        marginBottom: "4px"
      }}>
        Valerie De Leon, CSR #13025
      </div>
      <div style={{
        width: "200px",
        height: "1px",
        backgroundColor: "#e5e7eb",
        marginTop: "8px"
      }} />
    </div>
  );
} 