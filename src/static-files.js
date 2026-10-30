// Public, non-personalised templates served with the GitHub Pages site.
export const DEFAULT_TEMPLATE = 'assets/documents/certificate-demo.pdf';
export function validTemplatePath(path) {
  return typeof path === 'string' && /^assets\/documents\/[A-Za-z0-9_-]+\.pdf$/.test(path);
}
export async function loadTemplate(path) {
  if (!validTemplatePath(path)) throw new Error('Invalid template path');
  const response = await fetch(new URL(path, document.baseURI), {cache:'no-store'});
  if (!response.ok) throw {userMessage:document.documentElement.lang==='hr'
    ? 'PDF nije pronađen. Dodajte datoteku u assets/documents i objavite stranicu.'
    : 'PDF not found. Add the file to assets/documents and publish the site.'};
  const data = await response.arrayBuffer();
  if (data.byteLength > 10*1024*1024 || new TextDecoder().decode(data.slice(0,5)) !== '%PDF-') {
    throw {userMessage:document.documentElement.lang==='hr'?'Predložak mora biti PDF do 10 MB.':'The template must be a PDF up to 10 MB.'};
  }
  return data;
}
