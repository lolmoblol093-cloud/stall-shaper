import { directus, AppSetting } from '@/integrations/directus/client';
import { readItems, createItem, updateItem } from '@directus/sdk';

export const appSettingsService = {
  async getAll(): Promise<AppSetting[]> {
    const settings = await directus.request(readItems('app_settings'));
    return settings as AppSetting[];
  },

  async getByKey(key: string): Promise<AppSetting | null> {
    const settings = await directus.request(
      readItems('app_settings', {
        filter: { key: { _eq: key } },
        limit: 1,
      })
    );
    return (settings as AppSetting[])[0] || null;
  },

  async getValue<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.getByKey(key);
    return setting ? (setting.value as T) : null;
  },

  async set(key: string, value: Record<string, unknown>, description?: string): Promise<AppSetting> {
    const existing = await this.getByKey(key);
    
    if (existing) {
      const updated = await directus.request(
        updateItem('app_settings', existing.id, {
          value,
          description,
          updated_at: new Date().toISOString(),
        })
      );
      return updated as AppSetting;
    }

    const created = await directus.request(
      createItem('app_settings', {
        key,
        value,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    return created as AppSetting;
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
