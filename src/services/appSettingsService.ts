export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Local state for mock app settings
let appSettings: AppSetting[] = [
  {
    id: 'setting-1',
    key: 'property_name',
    value: { name: 'Marketplace Directory' },
    description: 'Property display name',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const appSettingsService = {
  async getAll(): Promise<AppSetting[]> {
    return [...appSettings];
  },

  async getByKey(key: string): Promise<AppSetting | null> {
    return appSettings.find(s => s.key === key) || null;
  },

  async getValue<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.getByKey(key);
    return setting ? (setting.value as T) : null;
  },

  async set(key: string, value: Record<string, unknown>, description?: string): Promise<AppSetting> {
    const existingIndex = appSettings.findIndex(s => s.key === key);
    
    if (existingIndex >= 0) {
      appSettings[existingIndex] = {
        ...appSettings[existingIndex],
        value,
        description: description || appSettings[existingIndex].description,
        updated_at: new Date().toISOString(),
      };
      return appSettings[existingIndex];
    }

    const newSetting: AppSetting = {
      id: `setting-${Date.now()}`,
      key,
      value,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    appSettings.push(newSetting);
    return newSetting;
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
