
import { createClient } from '@supabase/supabase-js';

// 这些配置通常放在 .env 文件中
// 为了方便你直接使用，我先留了空位，你需要去 Supabase 申请并填入
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 数据库表名
export const TABLE_NAME = 'kb_items';

export interface DBItem {
  id: string;
  sku: string;
  category: string;
  vehicle_model: string;
  problem_level: string;
  problem_type: string;
  problem_description: string;
  standard_answer: string;
  internal_solution: string;
  error_avoidance: string;
  update_time: string;
  attachments: string; // JSON string of string[]
  is_deleted: boolean;
}
