import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple DOCX text extractor - extracts text from document.xml
async function extractDocxText(buffer: Uint8Array): Promise<string> {
  // DOCX is a ZIP file, find and extract document.xml content
  const textDecoder = new TextDecoder();
  const content = textDecoder.decode(buffer);
  
  // Look for ZIP file signature and find document.xml
  // Simple approach: search for text content patterns in the binary
  const xmlMatches: string[] = [];
  
  // Try to find readable text sequences
  let currentText = "";
  for (let i = 0; i < buffer.length; i++) {
    const char = buffer[i];
    // Printable ASCII range
    if (char >= 32 && char <= 126) {
      currentText += String.fromCharCode(char);
    } else if (currentText.length > 3) {
      // Only keep sequences longer than 3 chars
      if (!currentText.includes("<?xml") && 
          !currentText.includes("xmlns") &&
          !currentText.includes("w:") &&
          !currentText.includes("Content") &&
          !currentText.includes("Relationship") &&
          !currentText.match(/^[A-Za-z0-9+/=]+$/)) { // Not base64
        xmlMatches.push(currentText.trim());
      }
      currentText = "";
    } else {
      currentText = "";
    }
  }

  // Better approach - try to decompress and parse
  try {
    // For DOCX, we need to use a different approach
    // Let's extract using pattern matching for <w:t> tags
    const uint8String = textDecoder.decode(buffer);
    
    // Find document.xml content within the ZIP
    const docXmlStart = uint8String.indexOf("<w:document");
    if (docXmlStart !== -1) {
      const docXmlEnd = uint8String.lastIndexOf("</w:document>");
      if (docXmlEnd !== -1) {
        const docXml = uint8String.slice(docXmlStart, docXmlEnd + 14);
        
        // Extract text from <w:t> tags
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        const matches = [...docXml.matchAll(textRegex)];
        if (matches.length > 0) {
          return matches.map(m => m[1]).join(" ").replace(/\s+/g, " ").trim();
        }
      }
    }
    
    // Fallback: extract any readable text
    const readableText = xmlMatches
      .filter(t => t.length > 10 && !t.includes("=") && !t.includes("{"))
      .join(" ");
    
    if (readableText.length > 50) {
      return readableText;
    }
    
    throw new Error("Could not extract text from DOCX");
  } catch {
    // Final fallback
    const filtered = xmlMatches.filter(t => 
      t.length > 5 && 
      !t.includes("PK") && 
      !t.includes("xml") &&
      !/^[0-9.]+$/.test(t)
    );
    
    if (filtered.length > 0) {
      return filtered.join(" ");
    }
    
    throw new Error("Could not extract meaningful text from DOCX file");
  }
}

// PDF text extractor - basic implementation
function extractPdfText(buffer: Uint8Array): string {
  const textDecoder = new TextDecoder("utf-8", { fatal: false });
  const content = textDecoder.decode(buffer);
  
  // Extract text from PDF streams
  const textContent: string[] = [];
  
  // Look for text in parentheses (PDF text objects)
  const textInParens = content.match(/\(([^)]+)\)/g);
  if (textInParens) {
    for (const match of textInParens) {
      const text = match.slice(1, -1);
      // Filter out binary/control sequences
      if (text.length > 2 && /^[\x20-\x7E\s]+$/.test(text)) {
        textContent.push(text);
      }
    }
  }
  
  // Also look for text in BT...ET blocks (text objects)
  const btBlocks = content.match(/BT[\s\S]*?ET/g);
  if (btBlocks) {
    for (const block of btBlocks) {
      // Extract Tj and TJ operators
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
      if (tjMatches) {
        for (const tj of tjMatches) {
          const text = tj.match(/\(([^)]*)\)/)?.[1];
          if (text && text.length > 1 && /^[\x20-\x7E\s]+$/.test(text)) {
            textContent.push(text);
          }
        }
      }
      
      // TJ arrays
      const tjArrayMatches = block.match(/\[(.*?)\]\s*TJ/g);
      if (tjArrayMatches) {
        for (const tja of tjArrayMatches) {
          const innerTexts = tja.match(/\(([^)]*)\)/g);
          if (innerTexts) {
            for (const it of innerTexts) {
              const text = it.slice(1, -1);
              if (text.length > 0 && /^[\x20-\x7E\s]*$/.test(text)) {
                textContent.push(text);
              }
            }
          }
        }
      }
    }
  }
  
  // Deduplicate and join
  const uniqueTexts = [...new Set(textContent)];
  let result = uniqueTexts.join(" ").replace(/\s+/g, " ").trim();
  
  // If we got very little text, try a different approach
  if (result.length < 50) {
    // Look for stream content
    const streams = content.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
    if (streams) {
      const streamTexts: string[] = [];
      for (const stream of streams) {
        // Extract readable ASCII from streams
        const readable = stream.replace(/[^\x20-\x7E\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (readable.length > 20) {
          streamTexts.push(readable);
        }
      }
      if (streamTexts.length > 0) {
        result = streamTexts.join(" ").slice(0, 10000);
      }
    }
  }
  
  if (result.length < 10) {
    throw new Error("Could not extract meaningful text from PDF. The PDF may be image-based or encrypted.");
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    const fileName = file.name.toLowerCase();
    const buffer = new Uint8Array(await file.arrayBuffer());
    
    let extractedText = "";
    
    if (fileName.endsWith(".pdf")) {
      extractedText = extractPdfText(buffer);
    } else if (fileName.endsWith(".docx")) {
      extractedText = await extractDocxText(buffer);
    } else if (fileName.endsWith(".txt")) {
      extractedText = new TextDecoder().decode(buffer);
    } else {
      throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT files.");
    }

    // Limit text length
    if (extractedText.length > 50000) {
      extractedText = extractedText.slice(0, 50000) + "... (truncated)";
    }

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        charCount: extractedText.length,
        fileName: file.name 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Document parsing error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to parse document" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});