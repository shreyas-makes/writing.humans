import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  id?: string;
  user_id?: string;
  openai_api_key?: string;
  ai_model: string;
  suggestion_frequency: 'low' | 'normal' | 'high';
  max_suggestions: number;
  created_at?: string;
  updated_at?: string;
}

const defaultSettings: UserSettings = {
  ai_model: 'gpt-3.5-turbo',
  suggestion_frequency: 'normal',
  max_suggestions: 3,
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user settings
  const loadSettings = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading settings:', error);
        toast({
          title: "Error loading settings",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // No settings found, use defaults
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Unexpected error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save user settings
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return false;

    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, ...newSettings };

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: "Error saving settings",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setSettings(data);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Unexpected error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update a specific setting
  const updateSetting = async (key: keyof UserSettings, value: any) => {
    return await saveSettings({ [key]: value });
  };

  // Load settings when user changes
  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateSetting,
    loadSettings,
  };
}; 