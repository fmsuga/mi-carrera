// Optional development utility. Pass a local sharp module path if not installed.
import fs from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
const { default: sharp } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'sharp');
const source = await fs.readFile(new URL('../assets/favicon.svg',import.meta.url));
for (const [size,file] of [[16,'favicon-16'],[32,'favicon-32'],[180,'apple-touch-icon'],[192,'icon-192'],[512,'icon-512']]) {
  await sharp(source).resize(size,size).png().toFile(fileURLToPath(new URL('../assets/'+file+'.png',import.meta.url)));
}
