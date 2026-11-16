import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {runBrowserQA} from '../tests/browser-qa.mjs';
const playwright=await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'playwright');
const browser=await playwright.chromium.launch({channel:'msedge',headless:true});
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  const result=await runBrowserQA(page);
  await fs.writeFile(new URL('../docs/browser-qa.json',import.meta.url),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
