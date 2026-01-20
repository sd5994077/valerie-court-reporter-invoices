import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 10, // Maximum execution time for Vercel free tier
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[PDF API] Starting PDF generation...');

  try {
    const { invoiceHtml, filename } = req.body;

    if (!invoiceHtml) {
      return res.status(400).json({ error: 'Invoice HTML is required' });
    }

    console.log('[PDF API] Launching Chromium...');

    // Launch Chromium with serverless-optimized settings
    const execPath = await chromium.executablePath();
    console.log('[PDF API] Chromium path:', execPath);
    
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage', // Important for containerized environments
        '--disable-gpu',
        '--no-sandbox',
      ],
      defaultViewport: {
        width: 816, // Letter width at 96dpi (8.5in)
        height: 1056, // Letter height at 96dpi (11in)
      },
      executablePath: execPath,
      headless: true,
    });

    console.log('[PDF API] Chromium launched, creating page...');

    const page = await browser.newPage();

    // Set content with the invoice HTML
    // Use 'domcontentloaded' instead of 'networkidle0' for faster loading
    // Images are already base64-embedded, no network requests needed
    await page.setContent(invoiceHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 8000,
    });

    console.log('[PDF API] Page content set, waiting briefly for rendering...');
    
    // Small delay for CSS/layout to settle (fonts are fallback-friendly)
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
    
    console.log('[PDF API] Fonts loaded, generating PDF...');

    // Generate PDF
    const pdfOutput = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.25in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
      },
    });

    await browser.close();

    // Puppeteer may return Buffer or Uint8Array depending on version/types.
    // Normalize to Node.js Buffer for reliable validation + response sending.
    const pdfBuffer = Buffer.from(pdfOutput as any);

    console.log('[PDF API] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Verify it's a valid PDF (should start with %PDF)
    const pdfHeader = pdfBuffer.subarray(0, 4).toString('ascii');
    if (!pdfHeader.startsWith('%PDF')) {
      console.error('[PDF API] Invalid PDF generated, starts with:', pdfHeader);
      throw new Error('Generated file is not a valid PDF');
    }

    // Set response headers for PDF download (best practices)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    // Use inline for better iOS compatibility, client handles actual download
    res.setHeader('Content-Disposition', `inline; filename="${filename || 'invoice.pdf'}"`);
    // Don't set Content-Length - let Node.js handle it automatically to avoid truncation

    // Send the PDF using .end() for raw binary data
    res.status(200).end(pdfBuffer);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[PDF API] Error generating PDF:', errorMessage);
    console.error('[PDF API] Stack:', errorStack);
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: errorMessage,
      // Include first part of stack for debugging
      debug: errorStack?.split('\n').slice(0, 3).join(' | ')
    });
  }
}
