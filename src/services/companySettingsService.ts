import { supabase } from '../lib/supabase';
import { CompanySettings } from '../types';

const TABLE_NAME = 'company_settings';
const SETTINGS_ID = 'company-settings'; // Fixed ID for the single settings row

export const companySettingsService = {
  async get(): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', SETTINGS_ID) // Fetch the row with the fixed ID
        .single();

      if (error) {
        console.error('Error fetching company settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in get company settings:', error);
      return null;
    }
  },

  async save(settings: CompanySettings): Promise<CompanySettings | null> {
    try {
      // Ensure the settings object has the fixed ID for upsert
      const settingsToSave = {
        ...settings,
        id: SETTINGS_ID,
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .upsert([settingsToSave]) // Upsert using the settings object with the fixed ID
        .select()
        .single();

      if (error) {
        console.error('Error saving company settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in save company settings:', error);
      return null;
    }
  },

  async uploadLogo(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in upload logo:', error);
      return null;
    }
  }
}; 