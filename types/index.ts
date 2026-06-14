export interface LinePositions {
  zeroTop: number;
  calibTop: number;
  measureTop: number;
  mochiTop: number;
}

export interface CalcInput extends LinePositions {
  totalStart: number | null;
  border: number | null;
  tamaPerYen: number;
}

export interface CalcResult {
  toushiTama: number | null;
  mochiTama: number | null;
  estimatedInvest: number | null;
  rate: number | null;
  judge: 'good' | 'neutral' | 'bad' | null;
  judgeDetail: string;
}

export type LineKey = 'zero' | 'calib' | 'measure' | 'mochi';

export interface LineConfig {
  key: LineKey;
  color: string;
  label: string;
}
