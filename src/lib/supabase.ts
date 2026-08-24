import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_SUPABASE_URL = 'village_census_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'village_census_supabase_key';

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ofghjljecizgopxjjijx.supabase.co';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || envUrl;
  const storedKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || envKey;

  return {
    url: storedUrl,
    anonKey: storedKey,
    isConnected: Boolean(storedUrl && storedKey && storedUrl.startsWith('https://'))
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.isConnected) {
    supabaseInstance = null;
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'សូមបញ្ចូល Supabase URL និង Anon Key' };
  }

  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { error } = await testClient.from('village_settings').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still connected to Supabase
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return { 
          success: true, 
          message: 'ភ្ជាប់ទៅកាន់ Supabase ជោគជ័យ! (សូមកុំភ្លេច Run SQL Schema ដើម្បីបង្កើតតារាង)' 
        };
      }
      return { success: false, message: `កំហុសពី Supabase: ${error.message}` };
    }

    return { success: true, message: 'ការភ្ជាប់ទៅកាន់ Supabase Database ដំណើរការយ៉ាងល្អឥតខ្ចោះ!' };
  } catch (err: any) {
    return { success: false, message: `បរាជ័យក្នុងការភ្ជាប់: ${err.message || 'Unknown error'}` };
  }
}
