import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// フェーズ1では認証・保存機能は使用しない。接続準備のみ。
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
