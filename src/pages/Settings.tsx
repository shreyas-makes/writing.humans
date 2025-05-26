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
  const { settings, isLoading, isSaving, updateSetting, updateApiKey } = useUserSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const handleModelChange = async (model: string) => {
    await updateSetting('ai_model', model);
  };

  const handleApiKeyUpdate = async () => {
    if (apiKeyValue.trim()) {
      const success = await updateApiKey(apiKeyValue.trim());
      if (success) {
        toast({
          title: "API Key Updated",
          description: "Your OpenAI API key has been updated successfully.",
        });
        setApiKeyValue('');
      }
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
        <div className="container flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <LogoHeader onClick={() => navigate(user ? '/home' : '/')} />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* OpenAI API Configuration */}
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Key className="h-5 w-5" />
              OpenAI API Configuration
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Configure your OpenAI API settings. Your API key is stored securely and encrypted on our servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* API Key Section */}
            <div className="space-y-3">
              <Label htmlFor="api-key" className="text-sm font-medium">OpenAI API Key</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder={settings.has_openai_api_key ? "API key configured" : "Enter your OpenAI API key"}
                    value={showApiKey && settings.has_openai_api_key ? getMaskedApiKey() : apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    className="pr-12 h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
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
                  className="h-11 px-6"
                >
                  {settings.has_openai_api_key ? 'Update' : 'Add'}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {settings.has_openai_api_key ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    API key is configured and ready to use
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    No API key configured. Add one to enable AI suggestions.
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="model" className="text-sm font-medium">AI Model</Label>
                <Select
                  value={settings.ai_model}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                    <SelectItem value="gpt-4">gpt-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Suggestion Timing</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span><strong>First suggestion:</strong> Triggers after 2 lines of content (300ms delay)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span><strong>Copy-paste detection:</strong> Immediate suggestions for pasted content (200ms delay)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span><strong>Subsequent suggestions:</strong> Every 3 minutes for content changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span><strong>Fallback protection:</strong> 30+ characters if 2-line detection fails (800ms delay)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Optimized timing reduces API costs while providing fast feedback for new users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings; 