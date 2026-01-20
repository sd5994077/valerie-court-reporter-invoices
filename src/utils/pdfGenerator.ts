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
    
    // Wait for images to load with better error handling
    const imgs = Array.from(tempContainer.querySelectorAll('img'));
    console.log(`[PDF] Waiting for ${imgs.length} images to load...`);
    
    await Promise.all(
      imgs.map((img, index) => {
        if (img.complete && img.naturalWidth > 0) {
          console.log(`[PDF] Image ${index + 1} already loaded:`, img.src);
          return Promise.resolve();
        }
        
        console.log(`[PDF] Waiting for image ${index + 1}:`, img.src);
        return new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            console.warn(`[PDF] Image ${index + 1} timed out:`, img.src);
            resolve();
          }, 5000); // Increased timeout to 5 seconds
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log(`[PDF] Image ${index + 1} loaded successfully:`, img.src);
            resolve();
          };
          
          img.onerror = (e) => {
            clearTimeout(timeout);
            console.error(`[PDF] Image ${index + 1} failed to load:`, img.src, e);
            resolve();
          };
        });
      })
    );
    
    console.log('[PDF] All images processed, extracting HTML...');
    
    // Get the complete HTML including styles
    const pdfElement = tempContainer.querySelector('#invoice-pdf-content');
    if (!pdfElement) {
      throw new Error('Failed to render PDF content');
    }
    
    // Convert all images to base64 data URIs for server-side rendering
    console.log('[PDF] Converting images to base64...');
    const images = Array.from(pdfElement.querySelectorAll('img'));
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      try {
        if (img.src && !img.src.startsWith('data:')) {
          const originalSrc = img.src;
          
          // Verify image is actually loaded and decoded
          if (!img.complete || img.naturalWidth === 0) {
            console.warn(`[PDF] Skipping unloaded image ${i + 1}:`, originalSrc, 
              `(complete: ${img.complete}, naturalWidth: ${img.naturalWidth})`);
            skipCount++;
            continue;
          }
          
          // Create a canvas to convert image to base64
          const canvas = document.createElement('canvas');
          
          // Use original dimensions to avoid any resizing issues
          // This is safer and still embeds the image properly
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('[PDF] Could not get canvas context for:', originalSrc);
            skipCount++;
            continue;
          }
          
          // Draw image at original size
          ctx.drawImage(img, 0, 0);
          
          // Convert to PNG to preserve transparency
          const dataUrl = canvas.toDataURL('image/png');
          
          // Validate the data URL was created successfully
          if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
            console.warn('[PDF] Invalid data URL created for:', originalSrc);
            skipCount++;
            continue;
          }
          
          // Only replace src if conversion succeeded
          img.src = dataUrl;
          successCount++;
          console.log(`[PDF] Converted image: ${originalSrc} (${img.naturalWidth}x${img.naturalHeight})`);
        }
      } catch (err) {
        console.warn('[PDF] Failed to convert image to base64:', err);
        skipCount++;
        // Don't replace src on error - leave original
      }
    }
    
    console.log(`[PDF] Image conversion complete: ${successCount} converted, ${skipCount} skipped/failed`);
    
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
    // Format: INV-2026-0001-Travis.pdf (include county if available)
    const county = invoiceData.customFields?.county;
    const filename = county 
      ? `${invoiceData.invoiceNumber}-${county}.pdf`
      : `${invoiceData.invoiceNumber}.pdf`;
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
    
    // Verify we received a valid PDF
    const arrayBuf = await pdfBlob.arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(arrayBuf.slice(0, 20)));
    console.log('[PDF] Response header:', header);
    
    if (!header.startsWith('%PDF')) {
      console.error('[PDF] Invalid PDF received from server. Response starts with:', header);
      throw new Error('Server returned invalid PDF. Response: ' + header);
    }
    
    console.log('[PDF] Valid PDF received, size:', arrayBuf.byteLength, 'bytes');
    
    // Recreate blob with proper type
    const validatedBlob = new Blob([arrayBuf], { type: 'application/pdf' });
    
    // Detect iOS for different download strategies
    const isIOS = isProbablyIOS();
    
    if (isIOS) {
      // Try Web Share API first (best for iOS, but often fails after async operations)
      const file = new File([validatedBlob], filename, { type: 'application/pdf' });
      
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
      const blobUrl = URL.createObjectURL(validatedBlob);
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
      const blobUrl = URL.createObjectURL(validatedBlob);
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
