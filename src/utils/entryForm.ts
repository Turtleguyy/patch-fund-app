import { Alert } from 'react-native';
import { LogDirection } from '../services/storageService';

export type EntryFormValidation = 'amount' | 'reason' | null;

export function amountDeltaToDirection(amountDelta: number): LogDirection {
  return amountDelta >= 0 ? 'add' : 'take';
}

export function amountDeltaToAmountText(amountDelta: number): string {
  return String(Math.abs(amountDelta) || '');
}

export function directionAndAmountToDelta(direction: LogDirection, amountText: string): number {
  const amount = Number(amountText);
  return direction === 'add' ? amount : -amount;
}

export function validateEntryForm(amountText: string, reason: string): EntryFormValidation {
  const amount = Number(amountText);
  if (!amountText.trim() || Number.isNaN(amount) || amount <= 0) {
    return 'amount';
  }
  if (!reason.trim()) {
    return 'reason';
  }
  return null;
}

export function showEntryFormValidationAlert(error: EntryFormValidation): void {
  if (error === 'amount') {
    Alert.alert('Enter an amount', 'Use a number greater than zero.');
  } else if (error === 'reason') {
    Alert.alert('Add a note', 'What was this for?');
  }
}
