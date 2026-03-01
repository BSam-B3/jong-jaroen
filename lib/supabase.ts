import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for Jong Jaroen (จงเจริญ)
export type Profile = {
  id: string;
  full_name: string;
  role: 'freelancer' | 'customer';
  location: string;
  created_at: string;
};

export type Service = {
  id: string;
  provider_id: string;
  title: string;
  price_thb: number;
  category: string;
  created_at: string;
};

export type Job = {
  id: string;
  customer_id: string;
  service_id: string;
  status: 'pending' | 'completed';
  lottery_number: string | null;
  total_price_thb: number;
  created_at: string;
};
