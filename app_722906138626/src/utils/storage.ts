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

export function getItems(): KBItem[] {
  try {
    return JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
  } catch {
    return [];
  }
}

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
