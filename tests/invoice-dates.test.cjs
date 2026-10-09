const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual TypeScript utility without adding a test-runner dependency.
const source = fs.readFileSync(path.join(__dirname, '../src/utils/formatters.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);
const { formatDate } = loaded.exports;

test('invoice and hearing dates retain their calendar day across timezones', () => {
  const originalZone = process.env.TZ;
  try {
    for (const zone of ['America/Chicago', 'America/Los_Angeles', 'UTC', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
      process.env.TZ = zone;
      for (const [input, expected] of [
        ['2026-10-09', 'Oct 9, 2026'],
        ['2026-01-01', 'Jan 1, 2026'],
        ['2026-12-31', 'Dec 31, 2026'],
        ['2024-02-29', 'Feb 29, 2024'],
        ['2026-03-08', 'Mar 8, 2026'],
        ['2026-11-01', 'Nov 1, 2026']
      ]) {
        const saved = JSON.parse(JSON.stringify({ date: input, customFields: { dateOfHearing: input } }));
        assert.equal(formatDate(saved.date), expected, `${zone}: invoice ${input}`);
        assert.equal(formatDate(saved.customFields.dateOfHearing), expected, `${zone}: hearing ${input}`);
      }
    }
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});

test('timestamps still display in local time', () => {
  const originalZone = process.env.TZ;
  try {
    process.env.TZ = 'America/Chicago';
    assert.equal(formatDate('2026-10-09T00:00:00Z'), 'Oct 8, 2026');
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});
