import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 });
  }

  const { imageBase64, mediaType } = await req.json();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `この画像はパチンコの大当り履歴テーブルです。
テーブルの各行から以下の数値を読み取ってください：
- normalStart: 通常回転数（通常時のスタート数、整数）
- output: 出玉（獲得玉数、整数）
- round: ラウンド（例: "16R", "4R", "10R"、文字列）
- jitan: 時短/ST回転数（整数）

JSON配列のみで返してください。余分な説明は不要です：
[
  {"normalStart": 225, "output": 1500, "round": "16R", "jitan": 100},
  {"normalStart": 110, "output": 2200, "round": "4R", "jitan": 0}
]

読み取れないカラムはnullにしてください。
行が見つからない場合は [] を返してください。`,
          },
        ],
      },
    ],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'パース失敗', raw: text }, { status: 422 });
  }

  const entries = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ entries });
}
