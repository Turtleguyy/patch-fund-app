export interface Profile {
  id: string;
  displayName: string;
}

export function profileNeedsSetup(displayName: string | null | undefined): boolean {
  const trimmed = displayName?.trim();
  return !trimmed || trimmed === 'Parent';
}
