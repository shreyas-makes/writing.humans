import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUserSettings } from '@/hooks/useUserSettings';
import { OpenAIService } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, isLoading, isSaving, updateSetting } = useUserSettings();
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.openai_api_key || '');

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      await updateSetting('openai_api_key', null);
      return;
    }

    setTestingApiKey(true);
    try {
      const isValid = await OpenAIService.testApiKey(apiKeyInput);
      if (isValid) {
        await updateSetting('openai_api_key', apiKeyInput);
        toast({
          title: "API key saved",
          description: "Your OpenAI API key has been validated and saved.",
        });
      } else {
        toast({
          title: "Invalid API key",
          description: "The API key you entered is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "API key test failed",
        description: "Could not validate the API key. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setTestingApiKey(false);
    }
  };

  const handleModelChange = async (model: string) => {
    await updateSetting('ai_model', model);
  };

  const handleFrequencyChange = async (frequency: string) => {
    await updateSetting('suggestion_frequency', frequency);
  };

  const handleMaxSuggestionsChange = async (maxSuggestions: string) => {
    await updateSetting('max_suggestions', parseInt(maxSuggestions));
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="font-semibold text-soft-blue">writing.humans</h1>
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
                Configure your OpenAI API key to enable AI-powered writing suggestions.
                Your API key is stored securely and only used for generating suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onBlur={handleSaveApiKey}
                  onFocus={() => setShowApiKey(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveApiKey();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  id="model"
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
                  id="frequency"
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