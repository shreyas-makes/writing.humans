import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Suggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  position?: { start: number, end: number };
}

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  onAcceptSuggestion: (suggestion: Suggestion) => void;
  onRejectSuggestion: (suggestion: Suggestion) => void;
}

const SuggestionPanel = ({ 
  suggestions, 
  onAcceptSuggestion, 
  onRejectSuggestion 
}: SuggestionPanelProps) => {
  if (suggestions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <p>No suggestions yet</p>
          <p className="text-sm mt-2">Start writing and AI suggestions will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="space-y-2">
          <CardHeader className="pb-1">
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            <div className="mb-2 space-y-2">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Original:</p>
              <p className="text-xs bg-muted p-2 rounded-md">{suggestion.originalText}</p>
            </div>
            <div className="mb-2 space-y-2">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Suggestion:</p>
              <p className="text-xs bg-primary/5 p-2 rounded-md border-l-2 border-primary">{suggestion.suggestedText}</p>
            </div>
            <div className="mb-2 space-y-2">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Explanation:</p>
              <p className="text-xs">{suggestion.explanation}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-suggest-red hover:text-suggest-red hover:bg-suggest-red/10"
                onClick={() => onRejectSuggestion(suggestion)}
              >
                <X className="h-4 w-4 mr-1" />
              </Button>
              <Button 
                size="sm" 
                className="bg-suggest-green/70 hover:bg-suggest-green/90 text-white"
                onClick={() => onAcceptSuggestion(suggestion)}
              >
                <Check className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SuggestionPanel;
