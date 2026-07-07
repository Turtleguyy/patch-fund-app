import { ParsedAllowanceEntry } from '../models/ParsedAllowanceEntry';

const WORD_TO_NUMBER: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const POSITIVE_KEYWORDS = ['add', 'earned', 'earn', 'give', 'gave', 'plus', 'reward', 'bonus'];
const NEGATIVE_KEYWORDS = ['lost', 'lose', 'take', 'take away', 'takeaway', 'dock', 'subtract', 'minus', 'deduct', 'penalty', 'fine'];

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

function extractReason(text: string): string {
  const becauseMatch = text.match(/\bbecause\b(.+)$/i);
  if (becauseMatch?.[1]) return becauseMatch[1].trim();

  const forMatch = text.match(/\bfor\b(.+)$/i);
  if (forMatch?.[1]) return forMatch[1].trim();

  return text.trim();
}

function parseAmount(text: string): { amount: number | null; confidence: number } {
  const dollarSignMatch = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollarSignMatch) {
    return { amount: Number(dollarSignMatch[1]), confidence: 0.95 };
  }

  const wordNumberPattern =
    /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:dollar|dollars|buck|bucks)\b/i;
  const wordMatch = text.match(wordNumberPattern);
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase();
    return { amount: WORD_TO_NUMBER[word] ?? null, confidence: 0.9 };
  }

  const numericPattern = /\b(\d+(?:\.\d{1,2})?)\s*(?:dollar|dollars|buck|bucks)\b/i;
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    return { amount: Number(numericMatch[1]), confidence: 0.9 };
  }

  const bareWordPattern = /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
  const bareWordMatch = text.match(bareWordPattern);
  if (bareWordMatch) {
    const word = bareWordMatch[1].toLowerCase();
    return { amount: WORD_TO_NUMBER[word] ?? null, confidence: 0.7 };
  }

  return { amount: null, confidence: 0 };
}

function detectDirection(text: string): { sign: 1 | -1 | null; confidence: number } {
  const lower = text.toLowerCase();

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { sign: -1, confidence: keyword.length > 4 ? 0.9 : 0.85 };
    }
  }

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { sign: 1, confidence: 0.85 };
    }
  }

  return { sign: null, confidence: 0 };
}

function extractChildName(text: string, knownChildNames: string[]): string | undefined {
  const lower = text.toLowerCase();
  const sortedNames = [...knownChildNames].sort((a, b) => b.length - a.length);

  for (const name of sortedNames) {
    const nameLower = name.toLowerCase();
    if (lower.startsWith(nameLower) || lower.includes(` ${nameLower} `)) {
      return name;
    }
  }

  return undefined;
}

function inferCategory(reason: string): string | undefined {
  const lower = reason.toLowerCase();
  if (/(mow|lawn|garage|clean|chore|dishes|trash)/.test(lower)) return 'chores';
  if (/(talk|attitude|rude|back|respect)/.test(lower)) return 'behavior';
  if (/(help|kind|share)/.test(lower)) return 'kindness';
  return undefined;
}

/**
 * Local heuristic parser for freeform allowance sentences.
 * Swap this implementation for an OpenAI structured-output call later.
 */
export function parseAllowanceEntry(
  input: string,
  knownChildNames: string[] = [],
): ParsedAllowanceEntry {
  const text = normalizeInput(input);
  if (!text) {
    return {
      amountDelta: 0,
      reason: '',
      confidence: 0,
      needsConfirmation: true,
    };
  }

  const { amount, confidence: amountConfidence } = parseAmount(text);
  const { sign, confidence: directionConfidence } = detectDirection(text);
  const childName = extractChildName(text, knownChildNames);
  const reason = extractReason(text);

  let confidence = Math.min(amountConfidence, directionConfidence);
  if (childName) confidence = Math.min(1, confidence + 0.05);

  const needsConfirmation = amount === null || sign === null || confidence < 0.75;
  const resolvedAmount = amount ?? 0;
  const resolvedSign = sign ?? 1;

  return {
    childName,
    amountDelta: resolvedAmount * resolvedSign,
    reason: reason || text,
    category: inferCategory(reason),
    confidence,
    needsConfirmation,
  };
}
