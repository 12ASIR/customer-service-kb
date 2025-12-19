import { supabase, TABLE_NAME, DBItem } from './supabaseClient';

export interface KBItem {
  id: string;
  sku: string;
  category: string;
  vehicle_model: string;
  problem_level: string;
  problem_type: string;
  problem_description: string;
  standard_answer: string;
  internal_solution: string;
  common_mistakes: string;
  update_time: string;
  attachments: number;
  attachment_urls?: string[];
}

const ITEMS_KEY = 'kb_items';
const DELETED_KEY = 'kb_deleted_ids';

let remoteData: KBItem[] = [];
let isRemoteLoaded = false;
let useCloud = false; // 标记是否启用云端模式

// 检查是否配置了 Supabase
export function isCloudEnabled() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY;
  return !!(url && key && url !== 'YOUR_SUPABASE_URL');
}

// 转换 Supabase 数据格式到本地格式
function mapDBItemToKBItem(item: DBItem): KBItem {
  let attachment_urls: string[] = [];
  try {
    attachment_urls = item.attachments ? JSON.parse(item.attachments) : [];
  } catch {
    attachment_urls = [];
  }
  
  return {
    id: item.id,
    sku: item.sku,
    category: item.category,
    vehicle_model: item.vehicle_model,
    problem_level: item.problem_level,
    problem_type: item.problem_type,
    problem_description: item.problem_description,
    standard_answer: item.standard_answer,
    internal_solution: item.internal_solution,
    common_mistakes: item.error_avoidance, // DB字段名映射
    update_time: item.update_time,
    attachments: attachment_urls.length,
    attachment_urls: attachment_urls
  };
}

// 转换本地格式到 Supabase 数据格式
function mapKBItemToDBItem(item: KBItem, is_deleted: boolean = false): DBItem {
  return {
    id: item.id,
    sku: item.sku,
    category: item.category,
    vehicle_model: item.vehicle_model,
    problem_level: item.problem_level,
    problem_type: item.problem_type,
    problem_description: item.problem_description,
    standard_answer: item.standard_answer,
    internal_solution: item.internal_solution,
    error_avoidance: item.common_mistakes,
    update_time: item.update_time,
    attachments: JSON.stringify(item.attachment_urls || []),
    is_deleted
  };
}

// 尝试加载部署的静态数据
async function loadRemoteData() {
  if (isRemoteLoaded) return;
  try {
    const response = await fetch('./kb_data.json');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        remoteData = data;
      }
    }
  } catch (e) {
    console.warn('Failed to load remote kb_data.json', e);
  } finally {
    isRemoteLoaded = true;
  }
}

// 初始化加载（非阻塞，调用者可能需要等待）
loadRemoteData();

// 获取所有数据（支持异步模式）
// 如果启用了云端，会优先从云端拉取
export async function fetchAllItems(): Promise<KBItem[]> {
  if (isCloudEnabled()) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('is_deleted', false);
        
      if (error) throw error;
      
      if (data) {
        return data.map(item => mapDBItemToKBItem(item as any));
      }
    } catch (e) {
      console.error('Cloud fetch failed, falling back to local', e);
    }
  }

  // Fallback to local + static remote
  return getItemsSync();
}

// 同步获取（旧方法兼容）
export function getItems(): KBItem[] {
  // 为了兼容旧代码，这里只能返回 Local + Static Remote
  // 实际上页面应该迁移到 fetchAllItems
  return getItemsSync();
}

function getItemsSync(): KBItem[] {
  try {
    const local = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    const localIds = new Set(local.map((i: KBItem) => i.id));
    const remoteFiltered = remoteData.filter(i => !localIds.has(i.id));
    return [...local, ...remoteFiltered];
  } catch {
    return remoteData;
  }
}

// 暴露一个强制刷新远程数据的方法
export async function refreshRemoteData() {
  isRemoteLoaded = false;
  await loadRemoteData();
}

// 保存所有数据（智能判断是存本地还是存云端）
// 注意：这个函数签名从 setItems(items) 变更为 saveItem(item) 更合适云端
// 但为了兼容，我们保留批量接口，但内部可能只处理变动
// 简单起见，如果开启云端，我们这里暂时不做全量覆盖（因为云端是数据库）
// 我们需要页面调用特定的 add/update/delete 方法
export async function syncItemToCloud(item: KBItem) {
  if (!isCloudEnabled()) return;
  
  const dbItem = mapKBItemToDBItem(item, false);
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(dbItem);
    
  if (error) console.error('Cloud sync failed', error);
}

export async function deleteItemFromCloud(id: string) {
  if (!isCloudEnabled()) return;
  
  // 软删除
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_deleted: true })
    .eq('id', id);
    
  if (error) console.error('Cloud delete failed', error);
}

// 兼容旧的 LocalStorage 接口
export function setItems(items: KBItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function getDeletedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function setDeletedIds(ids: string[]): void {
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
}
