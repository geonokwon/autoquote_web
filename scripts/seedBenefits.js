#!/usr/bin/env node

/* Usage: node scripts/seedBenefits.js
   Adds productBenefits & benefitRules (from discountRules.js)
   into db.json if they are missing. Works in ESM mode. */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'DB', 'db.json');

const DISCOUNT_RULE_PATH = path.join(__dirname, '..', 'src', 'constants', 'discountRules.js');

function extractConst(fileContent, constName) {
  const regex = new RegExp(`const\\s+${constName}\\s*=\\s*({[\\s\\S]*?});`, 'm');
  const match = fileContent.match(regex);
  if (!match) throw new Error(`${constName} not found`);
  /* eslint-disable no-eval */
  return eval('(' + match[1] + ')');
}

function main() {
  const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'));

  if (db.productBenefits && db.benefitRules) {
    console.log('db.json already contains productBenefits & benefitRules. Nothing to do.');
    return;
  }

  const discountRulesContent = readFileSync(DISCOUNT_RULE_PATH, 'utf-8');
  db.productBenefits = extractConst(discountRulesContent, 'productBenefits');
  db.benefitRules = extractConst(discountRulesContent, 'benefitRules');

  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('productBenefits & benefitRules have been written into db.json');
}

main(); 