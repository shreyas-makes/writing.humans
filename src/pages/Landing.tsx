import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LogoHeader from '@/components/ui/LogoHeader';

interface DemoSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
}

// Helper functions for diffing (copied from SuggestionPanel)
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
          if (text.trim() === '' && text.includes('\n')) return <span key={index}>{text}</span>;
          if (text.trim() === '') return <span key={index}>{text}</span>;
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

const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Static demo suggestions
  const demoSuggestions: DemoSuggestion[] = [
    {
      id: 'demo-1',
      originalText: 'This sentence is unnecessarily verbose and could benefit from simplification to enhance readability and comprehension for your audience.',
      suggestedText: 'This sentence is too wordy and should be simplified for better readability.',
      explanation: 'This sentence contains unnecessary words that make it harder to read. The suggested version is clearer and more direct.'
    },
    {
      id: 'demo-2',
      originalText: 'Writing compelling content requires skill, practice, and attention to detail.',
      suggestedText: 'Writing compelling content requires skill and practice.',
      explanation: 'Remove redundant words to make the sentence more impactful.'
    },
    {
      id: 'demo-3',
      originalText: 'Join thousands of writers who use our platform to create content that captures attention, communicates effectively, and achieves their goals with greater efficiency and impact.',
      suggestedText: 'Join thousands of writers who use our platform to create impactful content that achieves their goals.',
      explanation: 'Simplify this sentence by removing redundant phrases and making it more concise.'
    }
  ];

  const [selectedSuggestion, setSelectedSuggestion] = useState<DemoSuggestion>(demoSuggestions[0]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  // Position suggestion indicators using the Editor component logic
  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return;

    // Remove existing suggestion indicators
    const existingIndicators = containerRef.current.querySelectorAll('.suggestion-indicator');
    existingIndicators.forEach(indicator => indicator.remove());

    // Add new suggestion indicators for non-accepted suggestions
    demoSuggestions.forEach(suggestion => {
      if (acceptedSuggestions.includes(suggestion.id)) return;

      try {
        // Find the span element with the suggestion data
        const suggestionSpan = editorRef.current!.querySelector(`[data-suggestion-id="${suggestion.id}"]`);
        if (!suggestionSpan || !containerRef.current) return;

        // Create the indicator element positioned relative to the container
        const indicator = document.createElement('div');
        indicator.className = `suggestion-indicator absolute w-2.5 h-2.5 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 hover:scale-110 transition-all duration-200 z-10 shadow-md ${
          selectedSuggestion?.id === suggestion.id ? 'ring-1 ring-blue-300 ring-offset-1' : ''
        }`;
        indicator.title = 'Click to see AI suggestion';
        
        // Add click handler
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          handleSuggestionClick(suggestion);
        });

        // Position the indicator using the Editor component logic
        const targetRect = suggestionSpan.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const editorRect = editorRef.current!.getBoundingClientRect();
        
        // Calculate position relative to the container
        const relativeTop = targetRect.top - containerRect.top + targetRect.height / 2 - 5;
        // Position the indicator in the left margin of the editor, giving it more breathing room
        const relativeLeft = editorRect.left - containerRect.left - 20;
        
        indicator.style.left = `${relativeLeft}px`;
        indicator.style.top = `${relativeTop}px`;
        
        // Add to the container so it scrolls with the content
        containerRef.current.appendChild(indicator);
      } catch (error) {
        console.warn('Failed to place suggestion indicator:', error);
      }
    });
  }, [selectedSuggestion, acceptedSuggestions, demoSuggestions]);

  const handleSuggestionClick = (suggestion: DemoSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleAcceptSuggestion = () => {
    if (selectedSuggestion) {
      setAcceptedSuggestions(prev => [...prev, selectedSuggestion.id]);
      // Move to next suggestion
      const currentIndex = demoSuggestions.findIndex(s => s.id === selectedSuggestion.id);
      const nextIndex = (currentIndex + 1) % demoSuggestions.length;
      setSelectedSuggestion(demoSuggestions[nextIndex]);
    }
  };

  const handleRejectSuggestion = () => {
    if (selectedSuggestion) {
      // Move to next suggestion
      const currentIndex = demoSuggestions.findIndex(s => s.id === selectedSuggestion.id);
      const nextIndex = (currentIndex + 1) % demoSuggestions.length;
      setSelectedSuggestion(demoSuggestions[nextIndex]);
    }
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const renderTextWithSuggestions = (suggestionId: string) => {
    const suggestion = demoSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return null;

    const isAccepted = acceptedSuggestions.includes(suggestionId);
    const displayText = isAccepted ? suggestion.suggestedText : suggestion.originalText;

    return (
      <span 
        className="inline-block"
        data-suggestion-id={suggestionId}
      >
        {displayText}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 max-w-7xl mx-auto">
          <LogoHeader onClick={() => navigate('/')} />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" onClick={handleSignIn} size="sm" className="text-sm">
              Sign In
            </Button>
            <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 text-sm" size="sm">
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Live Editor Demo */}
      <section className="py-4 sm:py-8 px-3 sm:px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              {/* Editor Section */}
              <div className="flex-1">
                <div ref={containerRef} className="min-h-[400px] sm:min-h-[500px] border border-gray-200 rounded-lg bg-white relative shadow-lg pl-4 sm:pl-6 lg:pl-8">
                  <div ref={editorRef} className="prose prose-sm sm:prose-lg max-w-none px-3 sm:px-6 pt-8 sm:pt-16 ml-2 sm:ml-4 mr-2 sm:mr-3 pb-8 sm:pb-16">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Hey, writing humans!
                    </h1>
                    
                    <p className="text-gray-700 mb-3 sm:mb-4 mt-2 text-sm sm:text-base font-bold">
                      This is an AI writing tool for 100% human writing
                    </p>

                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      Confused what this means? Unlike other "AI-powered" writing apps, we let you do the writing, and let AI do what it's best at: suggesting improvements, edits, and fixes.
                    </p>

                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      It's a simple writing app, and each small detail and feature had to fight it's existence to make the final cut. Get into your writing flow state easily.
                    </p>

                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      {renderTextWithSuggestions('demo-1')} 
                    </p>
                    
                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      {renderTextWithSuggestions('demo-2')} Our tool analyzes your text as you write, identifying opportunities for improvement and suggesting specific changes that will make your message more powerful and engaging.
                    </p>
                    
                    <p className="text-gray-700 mb-3 text-sm sm:text-base">
                      {renderTextWithSuggestions('demo-3')}
                    </p>

                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      As you see in the earlier paragraphs, it ruthlessly edits all the AI-flaff and keeps your writing humane.
                    </p>

                    <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                      Sign up for an ideal balance of human writing flow, with an AI guide having your back.
                    </p>


                  </div>
                </div>
              </div>

              {/* AI Suggestions Panel */}
              <Card className="w-full lg:w-80 h-fit">
                {selectedSuggestion ? (
                  <div className="flex flex-col gap-3">
                    <Card key={selectedSuggestion.id} className="space-y-2">
                      <CardHeader className="pb-1 px-3 sm:px-6 pt-3 sm:pt-6">
                        <h3 className="text-sm font-medium">AI Suggestion</h3>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Proposed Change:</p>
                          <DiffDisplay originalText={selectedSuggestion.originalText} suggestedText={selectedSuggestion.suggestedText} />
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Explanation:</p>
                          <p className="text-xs leading-relaxed">{selectedSuggestion.explanation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-3 sm:p-4">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">No suggestion selected</p>
                      <p className="text-xs mt-2">Click on a suggestion indicator <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mx-1"></span> in the left margin to view details.</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;