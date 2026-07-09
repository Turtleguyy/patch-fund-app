import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedAllowanceEntry } from '../models/ParsedAllowanceEntry';
import { parseAllowanceEntry } from './parserService';

const parsedAllowanceEntrySchema = {
  name: 'parsed_allowance_entry',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      childName: { type: ['string', 'null'] },
      amountDelta: { type: 'number' },
      reason: { type: 'string' },
      category: { type: ['string', 'null'] },
      confidence: { type: 'number' },
      needsConfirmation: { type: 'boolean' },
    },
    required: [
      'childName',
      'amountDelta',
      'reason',
      'category',
      'confidence',
      'needsConfirmation',
    ],
    additionalProperties: false,
  },
} as const;

function getOpenAIClient(): OpenAI | null {
  if (!env.hasOpenAiApiKey) return null;
  return new OpenAI({
    apiKey: env.openAiApiKey,
    dangerouslyAllowBrowser: true,
  });
}

function normalizeParsedEntry(raw: ParsedAllowanceEntry): ParsedAllowanceEntry {
  return {
    childName: raw.childName ?? undefined,
    amountDelta: raw.amountDelta,
    reason: raw.reason.trim(),
    category: raw.category ?? undefined,
    confidence: raw.confidence,
    needsConfirmation: raw.needsConfirmation,
  };
}

/**
 * Parses allowance text with OpenAI structured outputs when configured,
 * otherwise falls back to local heuristics in parserService.
 */
export async function parseAllowanceEntryWithAI(
  input: string,
  knownChildNames: string[] = [],
): Promise<ParsedAllowanceEntry> {
  const client = getOpenAIClient();
  if (!client) {
    return parseAllowanceEntry(input, knownChildNames);
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            'You parse parent voice commands into allowance ledger entries.',
            'Positive amountDelta means the child earned money; negative means a deduction.',
            'Treat phrases like "-1 dollar" or "-$5" as negative amountDelta.',
            `Known children: ${knownChildNames.length > 0 ? knownChildNames.join(', ') : 'none provided'}.`,
            'Set needsConfirmation true when amount, direction, or child is ambiguous.',
            'Use confidence between 0 and 1.',
          ].join(' '),
        },
        { role: 'user', content: input },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: parsedAllowanceEntrySchema,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return parseAllowanceEntry(input, knownChildNames);
    }

    const parsed = normalizeParsedEntry(JSON.parse(content) as ParsedAllowanceEntry);
    if (!parsed.reason) {
      return parseAllowanceEntry(input, knownChildNames);
    }

    return parsed;
  } catch {
    return parseAllowanceEntry(input, knownChildNames);
  }
}
