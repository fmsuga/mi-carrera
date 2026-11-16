import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {runBrowserQA} from '../tests/browser-qa.mjs';
const modulePath=process.argv.slice(2).find(arg => !arg.startsWith('--'));
const playwright=await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser=await playwright.chromium.launch({channel:'msedge',headless:true});
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  const result=await runBrowserQA(page,{dashboardOnly:process.argv.includes('--dashboard-only')});
  await fs.writeFile(new URL('../docs/browser-qa.json',import.meta.url),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
