/**
 * One-off script: download defense.gov images using browser-like fetch headers.
 * Run: node scripts/download-defense-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT_DIR = path.join(process.cwd(), 'public', 'BattalionLogos', 'EastCoast');
const IMAGES = [
  ['230302-M-HC389-0001.PNG', 'https://media.defense.gov/2023/Mar/02/2003171204/150/150/0/230302-M-HC389-0001.PNG'],
  ['230302-M-HC389-0002.PNG', 'https://media.defense.gov/2023/Mar/02/2003171188/150/150/0/230302-M-HC389-0002.PNG'],
  ['230302-M-HC389-0003.PNG', 'https://media.defense.gov/2023/Mar/02/2003170825/150/150/0/230302-M-HC389-0003.PNG'],
  ['230301-M-HC389-0006.PNG', 'https://media.defense.gov/2023/Mar/01/2003170587/150/150/0/230301-M-HC389-0006.PNG'],
];

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/png,image/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.defense.gov/',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
};

async function download() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [filename, url] of IMAGES) {
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      const buf = await res.arrayBuffer();
      const outPath = path.join(OUT_DIR, filename);
      fs.writeFileSync(outPath, Buffer.from(buf));
      const isPng = buf.byteLength >= 8 && new Uint8Array(buf)[0] === 0x89 && new Uint8Array(buf)[1] === 0x50;
      console.log(isPng ? `OK ${filename}` : `WARN ${filename} may not be PNG (${buf.byteLength} bytes)`);
    } catch (e) {
      console.error(filename, e.message);
    }
  }
}

download();
