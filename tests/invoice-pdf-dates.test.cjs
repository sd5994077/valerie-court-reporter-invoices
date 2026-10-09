const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true
      }
    }).outputText;
    module._compile(compiled, filename);
  };
}

const { InvoicePDF } = require('../src/components/InvoicePDF.tsx');
const { InvoicePDFOnePager } = require('../src/components/InvoicePDFOnePager.tsx');

for (const [name, Component] of [['standard', InvoicePDF], ['one-page', InvoicePDFOnePager]]) {
  test(`${name} PDF renders the entered invoice and hearing dates in Central time`, () => {
    const originalZone = process.env.TZ;
    try {
      process.env.TZ = 'America/Chicago';
      const invoiceData = {
        invoiceNumber: 'INV-2026-9998',
        date: '2026-10-09',
        dueDate: '2026-11-08',
        lineItems: [{ number: 1, description: 'Date regression test', quantity: 1, rate: 100 }],
        customFields: { dateOfHearing: '2026-01-01', causeNumber: 'TEST', county: 'Hays County' }
      };
      const html = renderToStaticMarkup(React.createElement(Component, { invoiceData }));
      assert.match(html, /Oct 9, 2026/);
      assert.match(html, /Jan 1, 2026/);
      assert.doesNotMatch(html, /Oct 8, 2026|Dec 31, 2025/);
    } finally {
      if (originalZone === undefined) delete process.env.TZ;
      else process.env.TZ = originalZone;
    }
  });
}
