export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3EF',
  border: '#E4E4DD',
  text: '#1C1C1A',
  textMuted: '#6F6F66',
  accent: '#DB2777',
  accentLight: '#FDF2F8',
  positive: '#15803D',
  positiveLight: '#DCFCE7',
  negative: '#DC2626',
  negativeLight: '#FEE2E2',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 17,
    color: colors.text,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 14,
    color: colors.textMuted,
  },
};

function balanceTone(balance: number): 'positive' | 'negative' | 'neutral' {
  if (balance > 0) return 'positive';
  if (balance < 0) return 'negative';
  return 'neutral';
}

export function balanceColors(balance: number) {
  const tone = balanceTone(balance);
  if (tone === 'positive') {
    return { amount: colors.positive, surface: colors.positiveLight, border: '#86EFAC' };
  }
  if (tone === 'negative') {
    return { amount: colors.negative, surface: colors.negativeLight, border: '#FCA5A5' };
  }
  return { amount: colors.text, surface: colors.surface, border: colors.border };
}
