import type { ChartEntry } from '@/components/rashi/types';


export interface Profile {
  id?: string | number;
  profile_id?: number;
  first_name?: string;
  last_name?: string;
  dob?: string;
  tob?: string;
  moonSign?: string;
  moon_sign?: string;
  lagna?: string;
  lagna_sign?: string;
  nakshatra?: string;
  rashi_chart?: Record<number, ChartEntry>;
  bhava_chart?: Record<number, { label?: string; items?: string[] }>;
  navamsa_chart?: Record<number, ChartEntry>;
  dasha?: any;
  protection?: string;
  protection_engine?: string;
  processing_status?: 'pending' | 'completed' | 'failed';
  [key: string]: any;
}
