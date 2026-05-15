import { createClient } from './client';

// สร้างตัวแปร supabase ออกไปเลย หน้าอื่นจะได้ไม่ต้องสั่ง createClient() ซ้ำๆ ครับ
export const supabase = createClient();
