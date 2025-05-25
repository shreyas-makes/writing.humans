import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper functions for diffing
function splitText(text: string): string[] {
  return text.match(/(\w+)|(\s+)|([^\w\s])/g) || [];
}

function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return lcs;
}

function generateDiff(originalWords: string[], suggestedWords: string[], lcs: string[]): Array<[number, string]> {
  const diff: Array<[number, string]> = [];
  let ptrOriginal = 0;
  let ptrSuggested = 0;
  let ptrLCS = 0;

  while (ptrOriginal < originalWords.length || ptrSuggested < suggestedWords.length) {
    const lcsWord = ptrLCS < lcs.length ? lcs[ptrLCS] : null;
    const originalWord = ptrOriginal < originalWords.length ? originalWords[ptrOriginal] : null;
    const suggestedWord = ptrSuggested < suggestedWords.length ? suggestedWords[ptrSuggested] : null;

    if (originalWord !== null && originalWord === lcsWord && suggestedWord !== null && suggestedWord === lcsWord) {
      diff.push([0, originalWord]);
      ptrOriginal++;
      ptrSuggested++;
      ptrLCS++;
    } else if (originalWord !== null && (lcsWord === null || originalWord !== lcsWord || suggestedWord !== lcsWord /* Ensure original is consumed if not part of LCS involving suggestedWord */ )) {
      // If originalWord is not the LCS word, or if suggestedWord is also not the LCS word (implying originalWord must be a deletion)
      if (suggestedWord !== null && suggestedWord === lcsWord) { // If suggested is LCS, then original must be a delete IF it's not also LCS
         // This case is tricky, means original might be delete AND suggested might be insert before common lcs word
         // Prioritize consuming from original if it's not matching LCS
         diff.push([-1, originalWord]);
         ptrOriginal++;
      } else { // If suggestedWord is also not LCS word, or originalWord is simply not LCS
         diff.push([-1, originalWord]);
         ptrOriginal++;
      }
    } else if (suggestedWord !== null && (lcsWord === null || suggestedWord !== lcsWord)) {
      diff.push([1, suggestedWord]);
      ptrSuggested++;
    } else {
      break; 
    }
  }
  return diff;
}

const DiffDisplay = ({ originalText, suggestedText }: { originalText: string; suggestedText: string }) => {
  const originalWords = splitText(originalText);
  const suggestedWords = splitText(suggestedText);
  const lcs = computeLCS(originalWords, suggestedWords);
  const diffs = generateDiff(originalWords, suggestedWords, lcs);

  return (
    <div className="text-xs whitespace-pre-wrap p-2 rounded-md bg-muted dark:bg-zinc-800 leading-relaxed">
      {diffs.map(([type, text], index) => {
        if (type === 0) { // Common
          return <span key={index}>{text}</span>;
        } else if (type === -1) { // Deleted
          if (text.trim() === '' && text.includes('\n')) return <span key={index}>{text}</span>; // Preserve newlines as common
          if (text.trim() === '') return <span key={index}>{text}</span>; // Preserve other whitespace as common unless part of a deleted word block
          return <span key={index} className="bg-red-500/20 dark:bg-red-500/30 line-through decoration-red-500/70 dark:decoration-red-400/70 rounded-sm px-0.5 mx-[-0.5px]">{text}</span>;
        } else { // Added (type === 1)
          if (text.trim() === '' && text.includes('\n')) return <span key={index}>{text}</span>;
          if (text.trim() === '') return <span key={index}>{text}</span>;
          return <span key={index} className="bg-green-500/20 dark:bg-green-500/30 rounded-sm px-0.5 mx-[-0.5px]">{text}</span>;
        }
      })}
    </div>
  );
};

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
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Proposed Change:</p>
              <DiffDisplay originalText={suggestion.originalText} suggestedText={suggestion.suggestedText} />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Explanation:</p>
              <p className="text-xs">{suggestion.explanation}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
