import type { InvoiceFormData } from '../types/invoice';

export const isProbablyIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;
  const iPadOS = platform === 'MacIntel' && maxTouchPoints > 1;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  return iOSUA || iPadOS;
};

export const generatePDF = async (invoiceData: InvoiceFormData) => {
  try {
    console.log('[PDF] Starting server-side PDF generation...');
    
    // Render the invoice HTML
    const React = (await import('react')).default;
    const ReactDOM = (await import('react-dom/client')).default;
    const { InvoicePDF } = await import('../components/InvoicePDF');
    
    // Create a temporary container to render the invoice
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '794px'; // Letter width at 96dpi
    document.body.appendChild(tempContainer);
    
    const root = ReactDOM.createRoot(tempContainer);
    
    // Render and wait
    await new Promise<void>((resolve) => {
      root.render(React.createElement(InvoicePDF, { invoiceData }));
      setTimeout(resolve, 500);
    });
    
    // Wait for images to load
    const imgs = Array.from(tempContainer.querySelectorAll('img'));
    await Promise.all(
      imgs.map(img => 
        img.complete ? Promise.resolve() : new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 2000);
        })
      )
    );
    
    console.log('[PDF] Invoice rendered, extracting HTML...');
    
    // Get the complete HTML including styles
    const pdfElement = tempContainer.querySelector('#invoice-pdf-content');
    if (!pdfElement) {
      throw new Error('Failed to render PDF content');
    }
    
    // Convert all images to base64 data URIs for server-side rendering
    console.log('[PDF] Converting images to base64...');
    const images = Array.from(pdfElement.querySelectorAll('img'));
    for (const img of images) {
      try {
        if (img.src && !img.src.startsWith('data:')) {
          // Create a canvas to convert image to base64
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            img.src = dataUrl;
          }
        }
      } catch (err) {
        console.warn('[PDF] Failed to convert image to base64:', err);
      }
    }
    
    // Create a complete HTML document with all styles
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 8.5in; margin: 0; background: white; }
        </style>
      </head>
      <body>
        ${pdfElement.outerHTML}
      </body>
      </html>
    `;
    
    // Clean up the temp container
    root.unmount();
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
    
    console.log('[PDF] Sending to server for generation...');
    
    // Send to API for server-side PDF generation
    const filename = `${invoiceData.invoiceNumber}.pdf`;
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceHtml,
        filename,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Server-side PDF generation failed');
    }
    
    console.log('[PDF] PDF generated on server, downloading...');
    
    // Get the PDF blob from the response
    const pdfBlob = await response.blob();
    
    // Detect iOS for different download strategies
    const isIOS = isProbablyIOS();
    
    if (isIOS) {
      // Try Web Share API first (best for iOS, but often fails after async operations)
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          console.log('[PDF] Attempting iOS share sheet...');
          await navigator.share({ files: [file], title: 'Invoice PDF' });
          console.log('[PDF] Share sheet succeeded!');
          return { success: true, method: 'ios-share' };
        } catch (shareError: any) {
          // Share API failed (common after async operations), fall back to blob URL
          console.log('[PDF] Share API failed, using blob URL fallback:', shareError.message);
        }
      }
      
      // Fallback: Open in new tab (works reliably)
      console.log('[PDF] Opening PDF in new tab...');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const newTab = window.open(blobUrl, '_blank');
      
      if (!newTab) {
        // If popup blocked, try navigating current page
        console.log('[PDF] Popup blocked, navigating current page...');
        window.location.href = blobUrl;
      }
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return { success: true, method: 'ios-view' };
    } else {
      // Desktop/Android: Direct download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return { success: true, method: 'download' };
    }
    
  } catch (error) {
    console.error('[PDF] Generation failed:', error);
    throw error;
  }
};
