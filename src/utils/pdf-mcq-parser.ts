export interface McqQuestion {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export async function parsePdfBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  // 1. Try PDF.js CDN if window is available
  try {
    if (typeof window !== 'undefined') {
      if (!(window as any).pdfjsLib) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.head.appendChild(script);
        });
      }

      if ((window as any).pdfjsLib) {
        try {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (_) {}

        const uint8Data = new Uint8Array(arrayBuffer);
        const loadingTask = (window as any).pdfjsLib.getDocument({
          data: uint8Data,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          let lastY = null;
          let pageText = '';
          for (const item of content.items) {
            const y = item.transform ? item.transform[5] : null;
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
              pageText += '\n';
            } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
              pageText += ' ';
            }
            pageText += item.str;
            if (item.hasEOL) {
              pageText += '\n';
            }
            if (y !== null) {
              lastY = y;
            }
          }
          fullText += pageText + '\n';
        }

        if (fullText.trim().length > 5) {
          return fullText;
        }
      }
    }
  } catch (err) {
    console.warn('pdfjsLib extraction error:', err);
  }

  // 2. Pure browser DecompressionStream ('deflate-raw') zlib stream decompressor
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const rawStr = decoder.decode(uint8);

    const extractedStrings: string[] = [];
    const tjRegex = /\(([^()]{2,500})\)\s*T[j|d]/g;
    let match;
    while ((match = tjRegex.exec(rawStr)) !== null) {
      const s = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (s.length > 2 && !s.startsWith('/') && !s.startsWith('%')) {
        extractedStrings.push(s);
      }
    }

    if (extractedStrings.length > 5) {
      return extractedStrings.join('\n');
    }

    if (typeof DecompressionStream !== 'undefined') {
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let sMatch;
      while ((sMatch = streamRegex.exec(rawStr)) !== null) {
        try {
          const streamStr = sMatch[1];
          const bytes = new Uint8Array(streamStr.length);
          for (let i = 0; i < streamStr.length; i++) {
            bytes[i] = streamStr.charCodeAt(i) & 0xff;
          }
          if (bytes.length > 4) {
            const payload = (bytes[0] === 0x78) ? bytes.subarray(2) : bytes;
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(payload);
            writer.close();
            const res = new Response(ds.readable);
            const decompressed = await res.text();

            let m;
            while ((m = tjRegex.exec(decompressed)) !== null) {
              const txt = m[1].replace(/\\([()\\])/g, '$1').trim();
              if (txt.length > 2 && !txt.startsWith('/') && !txt.startsWith('%')) {
                extractedStrings.push(txt);
              }
            }
          }
        } catch (_) {}
      }
      if (extractedStrings.length > 3) {
        return extractedStrings.join('\n');
      }
    }
    return extractedStrings.join('\n');
  } catch (_) {
    return '';
  }
}

export function parseMcqsFromText(rawText: string, fileName = ''): McqQuestion[] {
  let cleanText = rawText || '';

  // Pre-split text by inserting line breaks before Q1., Q2., A., B., C., D., Answer:
  cleanText = cleanText
    .replace(/(Q\d+[\.\:\)]?|Question\s*\d+[\.\:\)]?)/gi, '\n$1')
    .replace(/([A-D][\.\)]\s)/g, '\n$1')
    .replace(/(Answer\s*[\:\=]\s*[A-D])/gi, '\n$1\n');

  const lines = cleanText.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  const questions: McqQuestion[] = [];

  let currentQText = '';
  let currentOptA = '';
  let currentOptB = '';
  let currentOptC = '';
  let currentOptD = '';
  let currentAns: 'A' | 'B' | 'C' | 'D' = 'A';
  let questionCount = 0;

  // Exact matching for Q1., Q2., A., B., C., D., Answer: B
  const qStartRegex = /^(?:Q\d+[\.\:\)]?|Question\s*\d+[\.\:\)]?|\d+[\.\)])\s*(.+)/i;
  const optARegex = /^(?:A[\.\)]|\(A\)|\[A\])\s*(.+)/i;
  const optBRegex = /^(?:B[\.\)]|\(B\)|\[B\])\s*(.+)/i;
  const optCRegex = /^(?:C[\.\)]|\(C\)|\[C\])\s*(.+)/i;
  const optDRegex = /^(?:D[\.\)]|\(D\)|\[D\])\s*(.+)/i;
  const ansRegex = /^(?:Answer|Ans|Correct(?:\s*Option)?|Key)[\s\:\-\=]*([A-D])/i;

  const pushCurrent = () => {
    if (currentQText) {
      questionCount++;
      questions.push({
        id: questionCount,
        text: currentQText,
        options: {
          A: currentOptA || 'Option A',
          B: currentOptB || 'Option B',
          C: currentOptC || 'Option C',
          D: currentOptD || 'Option D',
        },
        correctOption: currentAns,
      });
    }
    currentQText = '';
    currentOptA = '';
    currentOptB = '';
    currentOptC = '';
    currentOptD = '';
    currentAns = 'A';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const ansMatch = line.match(ansRegex);
    if (ansMatch) {
      currentAns = ansMatch[1].toUpperCase() as any;
      continue;
    }

    const aMatch = line.match(optARegex);
    if (aMatch) { currentOptA = aMatch[1]; continue; }
    const bMatch = line.match(optBRegex);
    if (bMatch) { currentOptB = bMatch[1]; continue; }
    const cMatch = line.match(optCRegex);
    if (cMatch) { currentOptC = cMatch[1]; continue; }
    const dMatch = line.match(optDRegex);
    if (dMatch) { currentOptD = dMatch[1]; continue; }

    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      pushCurrent();
      currentQText = qMatch[1];
      continue;
    }

    if (!currentOptA && currentQText) {
      currentQText += ' ' + line;
    }
  }

  pushCurrent();

  // Return parsed questions if found directly in text
  if (questions.length > 0) {
    return questions;
  }

  // Fallback: Split by sentences if explicit Q1/A/B/C/D markers were absent
  const cleanSentences = lines.filter(l => l.length > 5 && !l.startsWith('%'));
  if (cleanSentences.length > 0) {
    for (let idx = 0; idx < cleanSentences.length; idx += 6) {
      const qText = cleanSentences[idx];
      if (qText) {
        const cleanQ = qText.replace(/^[\d\.\s\-\)]+/, '');
        questions.push({
          id: questions.length + 1,
          text: cleanQ,
          options: {
            A: (cleanSentences[idx + 1] || 'Option A').replace(/^[A-Da-d][\.\)]\s*/, ''),
            B: (cleanSentences[idx + 2] || 'Option B').replace(/^[A-Da-d][\.\)]\s*/, ''),
            C: (cleanSentences[idx + 3] || 'Option C').replace(/^[A-Da-d][\.\)]\s*/, ''),
            D: (cleanSentences[idx + 4] || 'Option D').replace(/^[A-Da-d][\.\)]\s*/, ''),
          },
          correctOption: 'A',
        });
      }
    }
    if (questions.length > 0) {
      return questions;
    }
  }

  return [];
}
