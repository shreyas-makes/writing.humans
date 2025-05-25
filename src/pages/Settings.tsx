import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Settings as SettingsIcon, Eye, EyeOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LogoHeader from '@/components/ui/LogoHeader';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, isLoading, isSaving, updateSetting } = useUserSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const handleModelChange = async (model: string) => {
    await updateSetting('ai_model', model);
  };

  const handleFrequencyChange = async (frequency: string) => {
    await updateSetting('suggestion_frequency', frequency);
  };

  const handleMaxSuggestionsChange = async (maxSuggestions: string) => {
    await updateSetting('max_suggestions', parseInt(maxSuggestions));
  };

  const handleApiKeyUpdate = async () => {
    if (apiKeyValue.trim()) {
      // Here you would typically call an API to update the key
      // For now, we'll just show a toast
      toast({
        title: "API Key Updated",
        description: "Your OpenAI API key has been updated successfully.",
      });
      setApiKeyValue('');
    }
  };

  const getMaskedApiKey = () => {
    return settings.has_openai_api_key ? '••••••••••••••••••••••••••••••••••••••••••••••••••••' : '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <LogoHeader onClick={() => navigate(user ? '/home' : '/')} />
            <Separator orientation="vertical" className="h-6" />
            <h2 className="text-lg font-medium">Settings</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* OpenAI API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                OpenAI API Configuration
              </CardTitle>
              <CardDescription>
                Configure your OpenAI API settings. Your API key is stored securely and encrypted on our servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder={settings.has_openai_api_key ? "API key configured" : "Enter your OpenAI API key"}
                      value={showApiKey && settings.has_openai_api_key ? getMaskedApiKey() : apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleApiKeyUpdate}
                    disabled={!apiKeyValue.trim() || isSaving}
                    variant="outline"
                  >
                    {settings.has_openai_api_key ? 'Update' : 'Add'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.has_openai_api_key ? (
                    <span className="text-green-600">✓ API key is configured and ready to use</span>
                  ) : (
                    <span className="text-amber-600">⚠ No API key configured. Add one to enable AI suggestions.</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={settings.ai_model}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                    <SelectItem value="gpt-4">gpt-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="frequency">Suggestion Frequency</Label>
                <Select
                  value={settings.suggestion_frequency}
                  onValueChange={handleFrequencyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="max-suggestions">Max Suggestions</Label>
                <Input
                  id="max-suggestions"
                  type="number"
                  value={settings.max_suggestions.toString()}
                  onChange={(e) => handleMaxSuggestionsChange(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings; 