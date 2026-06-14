import type { CalcInput, CalcResult } from '@/types';

export function calcResult(input: CalcInput): CalcResult {
  const { zeroTop, calibTop, measureTop, mochiTop, totalStart, border, tamaPerYen } = input;

  const px10000 = calibTop - zeroTop;

  if (Math.abs(px10000) <= 2) {
    return { toushiTama: null, mochiTama: null, estimatedInvest: null, rate: null, judge: null, judgeDetail: '' };
  }

  const pxPerTama = px10000 / 10000;
  const toushiTama = Math.round(-((measureTop - zeroTop) / pxPerTama));
  const mochiTama = Math.round(-((mochiTop - measureTop) / pxPerTama));
  const estimatedInvest = toushiTama < 0 ? Math.abs(toushiTama) / tamaPerYen : 0;
  const rate = totalStart && estimatedInvest > 0
    ? Math.round(totalStart / estimatedInvest * 1000)
    : null;

  if (!totalStart) {
    return { toushiTama, mochiTama, estimatedInvest, rate: null, judge: null, judgeDetail: '' };
  }
  if (!rate) {
    return { toushiTama, mochiTama, estimatedInvest, rate: null, judge: null, judgeDetail: '' };
  }

  if (!border) {
    return { toushiTama, mochiTama, estimatedInvest, rate, judge: null, judgeDetail: '' };
  }

  const d = rate - border;
  if (d >= 2) {
    return { toushiTama, mochiTama, estimatedInvest, rate, judge: 'good', judgeDetail: `ボーダー(${border}回転)より${d}回転上回っています。` };
  } else if (d >= -1) {
    return { toushiTama, mochiTama, estimatedInvest, rate, judge: 'neutral', judgeDetail: `ボーダー(${border}回転)とほぼ同水準です。` };
  } else {
    return { toushiTama, mochiTama, estimatedInvest, rate, judge: 'bad', judgeDetail: `ボーダー(${border}回転)より${Math.abs(d)}回転下回っています。` };
  }
}
