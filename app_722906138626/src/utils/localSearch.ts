export interface SearchDoc {
  id: string;
  text: string;
}

function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x3040 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af)
  );
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\u3000\s]+/g, ' ')
    .replace(/[\p{P}\p{S}]/gu, ' ');
}

export function tokenize(text: string): string[] {
  const t = normalize(text);
  const tokens: string[] = [];
  for (const w of t.split(/\s+/).filter(Boolean)) {
    const chars = Array.from(w);
    if (chars.some(isCJK)) {
      for (let i = 0; i < chars.length; i++) {
        const unigram = chars[i];
        if (unigram.trim()) tokens.push(unigram);
        if (i < chars.length - 1) {
          const bigram = chars[i] + chars[i + 1];
          tokens.push(bigram);
        }
      }
    } else {
      tokens.push(w);
    }
  }
  return tokens;
}

function synonymsExpand(term: string): string[] {
  const map: Record<string, string[]> = {
    '不适配': ['不匹配','不吻合','对不齐','不合适','不兼容','不匹配性'],
    '安装': ['安装不上','装配','固定','组装','装上'],
    '支架': ['安装支架','固定件','支撑件','卡扣'],
    '孔位': ['螺丝孔','孔洞','孔位对齐','孔距'],
    '松动': ['不稳','晃动','松旷','松脱'],
  };
  const ex = map[term] || [];
  return [term, ...ex];
}

export interface SearchResult {
  id: string;
  score: number;
}

interface BuiltIndex {
  N: number;
  avgLen: number;
  docLengths: Record<string, number>;
  tf: Record<string, Record<string, number>>;
  df: Record<string, number>;
}

function buildIndex(docs: SearchDoc[]): BuiltIndex {
  const tf: BuiltIndex['tf'] = {};
  const df: BuiltIndex['df'] = {};
  const docLengths: Record<string, number> = {};
  for (const d of docs) {
    const tokens = tokenize(d.text);
    docLengths[d.id] = tokens.length;
    const counts: Record<string, number> = {};
    for (const tok of tokens) counts[tok] = (counts[tok] || 0) + 1;
    for (const [tok, c] of Object.entries(counts)) {
      if (!tf[tok]) tf[tok] = {};
      tf[tok][d.id] = c;
      df[tok] = (df[tok] || 0) + 1;
    }
  }
  const N = docs.length || 1;
  const avgLen = Object.values(docLengths).reduce((a, b) => a + b, 0) / N;
  return { N, avgLen, docLengths, tf, df };
}

export function search(query: string, docs: SearchDoc[], topK = 50): SearchResult[] {
  if (!query.trim()) return [];
  const index = buildIndex(docs);
  const k = 1.5;
  const b = 0.75;
  const qTokensRaw = tokenize(query);
  const qTokens = new Set<string>();
  for (const t of qTokensRaw) for (const e of synonymsExpand(t)) qTokens.add(e);

  const scores: Record<string, number> = {};
  for (const term of qTokens) {
    const df = index.df[term] || 0;
    if (df === 0) continue;
    const idf = Math.log((index.N - df + 0.5) / (df + 0.5) + 1);
    const postings = index.tf[term];
    for (const [docId, tf] of Object.entries(postings)) {
      const len = index.docLengths[docId] || 1;
      const denom = tf + k * (1 - b + b * (len / index.avgLen));
      const bm25 = idf * ((tf * (k + 1)) / denom);
      scores[docId] = (scores[docId] || 0) + bm25;
    }
  }

  const normalizedQuery = normalize(query).trim();
  if (normalizedQuery) {
    for (const d of docs) {
      if (normalize(d.text).includes(normalizedQuery)) {
        scores[d.id] = (scores[d.id] || 0) + 3;
      }
    }
  }

  return Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
