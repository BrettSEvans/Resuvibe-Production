import JSZip from "jszip";

const DOCX_TEXT_NODES = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function extractDocxText(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) {
    throw new Error("Could not read the DOCX document text.");
  }

  const parts = Array.from(documentXml.matchAll(DOCX_TEXT_NODES), (match) => decodeXmlText(match[1]));
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) {
    throw new Error("No text was found in the DOCX file.");
  }
  return text;
}

export async function extractSourceMaterialText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "text/plain" || name.endsWith(".txt")) {
    return file.text();
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return extractDocxText(file);
  }
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    throw new Error("PDF text extraction is not available in local-session mode yet. Paste the text instead.");
  }
  throw new Error("Use a DOCX or text file, or paste the content directly.");
}
