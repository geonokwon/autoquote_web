/*
  Usage:
    node scripts/convertProductBenefits.js

  This script reads ./db.json, converts the nested `productBenefits` object
  into a flat array collection named `product-benefits`, and writes the
  result to ./db_migrated.json (non-destructive).
*/

import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./DB/db.json');
const outPath = path.resolve('./DB/db_migrated.json');

if (!fs.existsSync(dbPath)) {
  console.error('db.json not found at', dbPath);
  process.exit(1);
}

/**
 * Ensure numeric id sequencing.
 */
function nextIdGenerator(start = 1) {
  let id = start;
  return () => id++;
}

try {
  const raw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);

  const source = data.productBenefits || {};
  const nextId = nextIdGenerator(1);
  const resultArray = [];

  Object.entries(source).forEach(([serviceKey, svcObj]) => {
    const { title: _ignore, ...options } = svcObj;
    Object.entries(options).forEach(([optionLabel, benefit]) => {
      const { giftCard = 0, cash = 0, perQuantity } = benefit;
      resultArray.push({
        id: nextId(),
        serviceKey,
        option: optionLabel,
        giftCard,
        cash,
        ...(perQuantity ? { perQuantity } : {})
      });
    });
  });

  // remove original productBenefits and add kebab-case array
  const newDb = {
    ...data,
    'product-benefits': resultArray
  };
  delete newDb.productBenefits;

  fs.writeFileSync(outPath, JSON.stringify(newDb, null, 2));
  console.log('Migration complete. Output:', outPath);
} catch (e) {
  console.error('Migration failed:', e);
  process.exit(1);
} 