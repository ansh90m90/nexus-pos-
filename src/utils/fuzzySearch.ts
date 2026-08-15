import { Item, Customer, Supplier } from '../types/pos';

/**
 * Phonetic & Typo-Tolerant Search Engine for POS and Inventory
 */

// Reduce repeated vowels and standard transliterations
export function normalizePhonetic(str: string): string {
  if (!str) return '';
  let s = str.toLowerCase().trim();

  // Common transliteration and sound equivalences (e.g. Hinglish, typos, phonetic sounds)
  // Double vowels: aa -> a, ee -> i, oo -> u, ii -> i, uu -> u
  s = s.replace(/aa+/g, 'a')
       .replace(/ee+/g, 'i')
       .replace(/oo+/g, 'u')
       .replace(/ii+/g, 'i')
       .replace(/uu+/g, 'u');

  // Common phonetic substitutions
  // cips -> chips / ch -> c
  s = s.replace(/ph/g, 'f')
       .replace(/gh/g, 'g')
       .replace(/kh/g, 'k')
       .replace(/dh/g, 'd')
       .replace(/th/g, 't')
       .replace(/bh/g, 'b')
       .replace(/sh/g, 's')
       .replace(/ck/g, 'k')
       .replace(/ch/g, 'c')
       .replace(/c(?=[eiy])/g, 's')
       .replace(/c/g, 'k')
       .replace(/q/g, 'k')
       .replace(/x/g, 'ks')
       .replace(/z/g, 's')
       .replace(/w/g, 'v');

  // Collapse repeated consonants
  s = s.replace(/([a-z])\1+/g, '$1');

  return s;
}

/**
 * Damerau-Levenshtein Distance (handles insertions, deletions, substitutions, and transpositions)
 */
export function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const lenA = a.length;
  const lenB = b.length;

  // Maximum allowed matrix
  const matrix: number[][] = Array(lenA + 1).fill(null).map(() => Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[lenA][lenB];
}

/**
 * Calculates a match score (0 - 100+) between a target text and a query token
 */
export function matchTokenScore(target: string, queryToken: string): number {
  if (!target || !queryToken) return 0;

  const t = target.toLowerCase().trim();
  const q = queryToken.toLowerCase().trim();

  if (!t || !q) return 0;

  // 1. Exact match
  if (t === q) return 100;

  // 2. Target contains query as whole substring
  if (t.includes(q)) {
    if (t.startsWith(q)) return 90;
    return 75;
  }

  // 3. Word starts with query token
  const words = t.split(/[\s,_\-./]+/);
  for (const w of words) {
    if (w === q) return 95;
    if (w.startsWith(q)) return 85;
    if (w.includes(q)) return 70;
  }

  // 4. Phonetic normalization match
  const tPhonetic = normalizePhonetic(t);
  const qPhonetic = normalizePhonetic(q);

  if (tPhonetic === qPhonetic) return 80;
  if (tPhonetic.includes(qPhonetic)) return 65;

  const phoneticWords = words.map(w => normalizePhonetic(w));
  for (const pw of phoneticWords) {
    if (pw === qPhonetic) return 75;
    if (pw.startsWith(qPhonetic)) return 60;
  }

  // 5. Fuzzy edit distance against individual words
  let bestWordScore = 0;
  for (const w of words) {
    if (w.length < 2) continue;

    const dist = damerauLevenshtein(w, q);
    const maxLen = Math.max(w.length, q.length);
    
    // Thresholds:
    // For length <= 3: dist must be <= 1
    // For length 4 - 6: dist <= 2
    // For length >= 7: dist <= 3
    const maxAllowedDist = maxLen <= 3 ? 1 : maxLen <= 6 ? 2 : 3;

    if (dist <= maxAllowedDist) {
      const similarity = 1 - (dist / maxLen);
      const score = Math.round(similarity * 60);
      if (score > bestWordScore) bestWordScore = score;
    }

    // Also compare phonetic distance
    const pDist = damerauLevenshtein(normalizePhonetic(w), qPhonetic);
    const pMaxLen = Math.max(normalizePhonetic(w).length, qPhonetic.length);
    const pAllowedDist = pMaxLen <= 3 ? 1 : pMaxLen <= 6 ? 2 : 2;
    if (pDist <= pAllowedDist) {
      const pSimilarity = 1 - (pDist / pMaxLen);
      const pScore = Math.round(pSimilarity * 55);
      if (pScore > bestWordScore) bestWordScore = pScore;
    }
  }

  if (bestWordScore > 0) return bestWordScore;

  // 6. Character sequence subset / Substring similarity for whole target if short
  if (t.length <= 15) {
    const dist = damerauLevenshtein(t, q);
    const maxLen = Math.max(t.length, q.length);
    const maxAllowedDist = maxLen <= 4 ? 1 : maxLen <= 7 ? 2 : 3;
    if (dist <= maxAllowedDist) {
      return Math.round((1 - (dist / maxLen)) * 50);
    }
  }

  return 0;
}

/**
 * Smart Search on Items:
 * Checks name, item_number (barcode/SKU), category, description, and variants.
 * Handles typos ("cips" -> "chips", "raahul" -> "rahul", "rahool" -> "rahul", "cheeps" -> "chips").
 */
export function searchItems(items: Item[], query: string, categoryFilter: string = 'All'): Item[] {
  if (!items || items.length === 0) return [];

  // Filter out deleted items first and apply category filter
  let pool = items.filter(i => !i.is_deleted);

  if (categoryFilter && categoryFilter !== 'All') {
    pool = pool.filter(i => i.category === categoryFilter);
  }

  const q = query.trim();
  if (!q) return pool;

  const queryTokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Score each item
  const scoredItems: { item: Item; score: number }[] = [];

  for (const item of pool) {
    // Collect all searchable strings for this item
    const searchTargets: { text: string; weight: number }[] = [
      { text: item.name, weight: 1.2 },
      { text: item.item_number, weight: 1.5 },
      { text: item.category || '', weight: 0.8 },
      { text: item.description || '', weight: 0.5 },
    ];

    if (item.variants && item.variants.length > 0) {
      for (const v of item.variants) {
        searchTargets.push({ text: v.name, weight: 1.1 });
        if (v.item_number) {
          searchTargets.push({ text: v.item_number, weight: 1.4 });
        }
      }
    }

    // Every query token must match at least one search target with score > threshold
    let totalItemScore = 0;
    let allTokensMatched = true;

    for (const token of queryTokens) {
      let maxTokenScore = 0;

      for (const target of searchTargets) {
        if (!target.text) continue;
        const rawScore = matchTokenScore(target.text, token);
        const weightedScore = rawScore * target.weight;
        if (weightedScore > maxTokenScore) {
          maxTokenScore = weightedScore;
        }
      }

      // Minimum acceptable score per token for fuzzy match (out of 100)
      if (maxTokenScore < 25) {
        allTokensMatched = false;
        break;
      }

      totalItemScore += maxTokenScore;
    }

    if (allTokensMatched && totalItemScore > 0) {
      scoredItems.push({ item, score: totalItemScore });
    }
  }

  // Sort by highest score first
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map(si => si.item);
}

/**
 * Smart Search on Customers (name, phone, email, account number, company)
 */
export function searchCustomers(customers: Customer[], query: string): Customer[] {
  if (!customers || customers.length === 0) return [];
  const q = query.trim();
  if (!q) return customers;

  const queryTokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  const scored: { customer: Customer; score: number }[] = [];

  for (const c of customers) {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    const searchTargets = [
      { text: fullName, weight: 1.3 },
      { text: c.first_name || '', weight: 1.2 },
      { text: c.last_name || '', weight: 1.2 },
      { text: c.phone_number || '', weight: 1.5 },
      { text: c.email || '', weight: 1.0 },
      { text: c.company_name || '', weight: 0.9 },
      { text: c.account_number || '', weight: 1.2 },
    ];

    let totalScore = 0;
    let allTokensMatched = true;

    for (const token of queryTokens) {
      let maxScore = 0;
      for (const target of searchTargets) {
        if (!target.text) continue;
        const s = matchTokenScore(target.text, token) * target.weight;
        if (s > maxScore) maxScore = s;
      }

      if (maxScore < 25) {
        allTokensMatched = false;
        break;
      }
      totalScore += maxScore;
    }

    if (allTokensMatched && totalScore > 0) {
      scored.push({ customer: c, score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.customer);
}

/**
 * Smart Search on Suppliers
 */
export function searchSuppliers(suppliers: Supplier[], query: string): Supplier[] {
  if (!suppliers || suppliers.length === 0) return [];
  const q = query.trim();
  if (!q) return suppliers;

  const queryTokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: { supplier: Supplier; score: number }[] = [];

  for (const s of suppliers) {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
    const targets = [
      { text: s.company_name || '', weight: 1.4 },
      { text: fullName, weight: 1.2 },
      { text: s.phone_number || '', weight: 1.4 },
      { text: s.email || '', weight: 1.0 },
      { text: s.account_number || '', weight: 1.2 },
    ];

    let totalScore = 0;
    let allTokensMatched = true;

    for (const token of queryTokens) {
      let maxScore = 0;
      for (const target of targets) {
        if (!target.text) continue;
        const score = matchTokenScore(target.text, token) * target.weight;
        if (score > maxScore) maxScore = score;
      }
      if (maxScore < 25) {
        allTokensMatched = false;
        break;
      }
      totalScore += maxScore;
    }

    if (allTokensMatched && totalScore > 0) {
      scored.push({ supplier: s, score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.supplier);
}
