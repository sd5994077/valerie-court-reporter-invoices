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
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    console.log('[PDF API] Chromium launched, creating page...');

    const page = await browser.newPage();

    // Set content with the invoice HTML
    await page.setContent(invoiceHtml, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 10000, // 10 second timeout for content loading (including fonts)
    });

    console.log('[PDF API] Page content set, waiting for fonts...');
    
    // Wait a bit for Google Fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    console.log('[PDF API] Fonts loaded, generating PDF...');

    // Generate PDF
    const pdfBuffer = await page.pdf({
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

    console.log('[PDF API] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Verify it's a valid PDF (should start with %PDF)
    const pdfHeader = pdfBuffer.slice(0, 4).toString('utf-8');
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
    console.error('[PDF API] Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
