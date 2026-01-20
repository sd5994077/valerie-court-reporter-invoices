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
      waitUntil: ['networkidle0', 'load'],
      timeout: 8000, // 8 second timeout for content loading
    });

    console.log('[PDF API] Page content set, generating PDF...');

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

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'invoice.pdf'}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('[PDF API] Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
