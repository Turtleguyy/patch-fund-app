export interface ParsedAllowanceEntry {
  childName?: string;
  amountDelta: number;
  reason: string;
  category?: string;
  confidence: number;
  needsConfirmation: boolean;
}
