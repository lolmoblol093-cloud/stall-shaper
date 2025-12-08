import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface AppSetting {
  id: string;
  key: string;
  value: Json | null;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const appSettingsService = {
  async getAll(): Promise<AppSetting[]> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');
    
    if (error) throw error;
    return data as AppSetting[];
  },

  async getByKey(key: string): Promise<AppSetting | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) return null;
    return data as AppSetting;
  },

  async getValue<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.getByKey(key);
    return setting ? (setting.value as T) : null;
  },

  async set(key: string, value: Record<string, unknown>, description?: string): Promise<AppSetting> {
    const existing = await this.getByKey(key);
    
    if (existing) {
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          value: value as Json,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AppSetting;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .insert({
        key,
        value: value as Json,
        description,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as AppSetting;
  },

  async getPropertyName(): Promise<string> {
    const setting = await this.getByKey('property_name');
    return (setting?.value as { name?: string })?.name || 'Property Management';
  },

  async setPropertyName(name: string): Promise<AppSetting> {
    return this.set('property_name', { name }, 'Property display name');
  },
};

export default appSettingsService;
