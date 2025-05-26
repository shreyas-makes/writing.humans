import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  let i = 0; // Pointer for originalWords
  let j = 0; // Pointer for suggestedWords
  let k = 0; // Pointer for lcs

  while (k < lcs.length) {
    // Consume deletions from originalWords
    while (i < originalWords.length && originalWords[i] !== lcs[k]) {
      diff.push([-1, originalWords[i]]);
      i++;
    }
    // Consume additions from suggestedWords
    while (j < suggestedWords.length && suggestedWords[j] !== lcs[k]) {
      diff.push([1, suggestedWords[j]]);
      j++;
    }
    
    // Consume common LCS element
    // Ensure pointers are within bounds before accessing elements
    if (i < originalWords.length && j < suggestedWords.length && k < lcs.length && 
        originalWords[i] === lcs[k] && suggestedWords[j] === lcs[k]) {
      diff.push([0, lcs[k]]);
      i++;
      j++;
      k++;
    } else {
      // If LCS element is not found at current positions of original/suggested,
      // it implies an issue with LCS or inputs, or remaining parts are purely add/delete.
      // For robustness, break here and let trailing logic handle the rest.
      // This case could also happen if lcs[k] was a whitespace/empty string that causes misalignment.
      // Given splitText can produce various tokens, this robust handling is safer.
      // If k < lcs.length but we can't match, it means lcs[k] is unmatchable with current i,j.
      // This might mean lcs[k] itself is problematic or i,j already passed its match.
      // The outer loops for remaining elements will handle non-LCS tails.
      // To prevent infinite loops if k doesn't advance but i and j also don't, we can advance k cautiously
      // or rely on the fact that i or j must advance to make progress towards lcs[k].
      // The most straightforward is that if originalWords[i] !== lcs[k] or suggestedWords[j] !== lcs[k],
      // the inner while loops should have handled them. So this 'else' suggests k should advance
      // or that the remaining parts don't involve lcs[k].
      // However, simply breaking and letting trailing additions/deletions handle seems safer.
      // If we are in this else, it means we couldn't make a 3-way match for lcs[k].
      // It's possible that lcs[k] was skipped due to prior advancement of i or j.
      // A simple break is fine as the post-loop logic will handle remaining words.
      break; 
    }
  }

  // Append remaining deletions from originalWords
  while (i < originalWords.length) {
    diff.push([-1, originalWords[i]]);
    i++;
  }

  // Append remaining additions from suggestedWords
  while (j < suggestedWords.length) {
    diff.push([1, suggestedWords[j]]);
    j++;
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
  theme?: string;
}

interface SuggestionPanelProps {
  suggestion: Suggestion | null;
  isGenerating?: boolean;
  // Debug props
  hasApiKey?: boolean;
  suggestions?: Suggestion[];
  error?: string | null;
}

const SuggestionPanel = ({ 
  suggestion,
  isGenerating = false,
  hasApiKey = false,
  suggestions = [],
  error = null
}: SuggestionPanelProps) => {
  // Show loading state when generating suggestions
  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground/70 text-xs">
          <div className="flex items-center justify-center mb-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p>Generating AI suggestions...</p>
          <p className="mt-1 text-xs opacity-70">This should only take a moment</p>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        {/* Error display if present */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800 text-xs">
            <div className="text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span> {error}
            </div>
            {!hasApiKey && (
              <div className="mt-2 text-amber-600 dark:text-amber-400">
                <span className="font-medium">💡 Solution:</span> Go to Settings and add your OpenAI API key
              </div>
            )}
          </div>
        )}


        
        <div className="text-center text-muted-foreground/70 text-xs">
          <p>No suggestion selected</p>
          <p className="mt-1">Click on a suggestion indicator <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mx-1"></span> in the editor to view details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionPanel;
