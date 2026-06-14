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
テーブルの各行から「回数」「時間」「スタート」の数値と、テキストの色（赤か黒か）を読み取ってください。

赤文字 = チャンス中の大当り（isChance: true）
黒文字 = 通常時からの大当り（isChance: false）

以下のJSON形式のみで返してください。余分な説明は不要です：
[
  {"round": 1, "time": "12:43", "start": 225, "isChance": false},
  {"round": 2, "time": "12:52", "start": 110, "isChance": false}
]

「-」の行（当選なし・継続中）は含めないでください。
テーブルに行が見つからない場合は空配列 [] を返してください。`,
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
