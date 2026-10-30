// Render the supplied PILC mark inside a code-native app-icon composition.
// The source logo remains unchanged; no replacement mark is drawn.
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const logo=(await readFile('assets/pilc-logo.png')).toString('base64');
await mkdir('assets/icons',{recursive:true});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#112d50"/><rect x="76" y="70" width="360" height="320" rx="54" fill="white"/><svg x="118" y="93" width="276" height="244" viewBox="245 150 375 320"><image width="1800" height="624" href="data:image/png;base64,${logo}"/></svg><text x="256" y="365" fill="#112d50" font-family="Arial,sans-serif" font-size="48" font-weight="700" text-anchor="middle">PILC</text><text x="256" y="439" fill="#ffa511" font-family="Arial,sans-serif" font-size="40" font-weight="700" letter-spacing="8" text-anchor="middle">2027</text></svg>`;
await writeFile('assets/icons/icon.svg',svg);
const browser=await chromium.launch();const page=await browser.newPage();
for(const [name,size] of [['icon-512',512],['icon-192',192],['apple-touch-icon',180],['maskable-512',512]]){
  await page.setViewportSize({width:size,height:size});
  // Maskable art is scaled into the central safe area, with a solid full-bleed background.
  await page.setContent(`<style>body{margin:0;background:#112d50;display:grid;place-items:center;width:100vw;height:100vh}svg{width:${name.startsWith('maskable')?80:100}vw;height:auto}</style>${svg}`);
  await page.screenshot({path:`assets/icons/${name}.png`});
}
await browser.close();
