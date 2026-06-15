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
  toushiTama: number | null;   // 赤ラインの投資玉数（±0からの差、負=損）
  mochiTama: number | null;    // オレンジラインの持ち玉（±0からの差）
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

export interface JackpotEntry {
  id: string;
  normalStart: number | null;  // 回転数
  output: number | null;       // 出玉（玉）
  round: number | null;        // ラウンド（例: 16, 4）
  jitan: number | null;        // 時短/ST（回転数）
}
