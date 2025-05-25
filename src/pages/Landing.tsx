import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';

interface DemoSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
}

const Landing = () => {
  const navigate = useNavigate();

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
    const isSelected = selectedSuggestion?.id === suggestionId;

    return (
      <span className="relative">
        {displayText}
        {!isAccepted && (
          <button
            onClick={() => handleSuggestionClick(suggestion)}
            className={`ml-2 w-3 h-3 rounded-full cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            title="Click to see AI suggestion"
          />
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">writing.humans</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Live Editor Demo */}
      <section className="py-8 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Editor Section */}
              <div className="flex-1">
                <Card className="shadow-lg border-0 bg-white">
                  <CardContent className="p-4 md:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="ml-4 text-sm text-gray-500">Demo Document</span>
                    </div>
                    <div className="min-h-[500px] border border-gray-200 rounded-lg p-6 bg-white">
                      <div className="prose prose-lg max-w-none">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                          Transform Your Writing with AI-Powered Assistance
                        </h1>
                        
                        <p className="text-gray-700 mb-4">
                          Our intelligent writing assistant helps you create clear, engaging content that resonates with your audience. Whether you're writing blog posts, marketing copy, or professional documents, our AI provides real-time suggestions to improve clarity, conciseness, and impact.
                        </p>
                        
                        <p className="text-gray-700 mb-4">
                          {renderTextWithSuggestions('demo-1')} The AI will suggest making it more concise and direct.
                        </p>
                        
                        <p className="text-gray-700 mb-4">
                          {renderTextWithSuggestions('demo-2')} Our tool analyzes your text as you write, identifying opportunities for improvement and suggesting specific changes that will make your message more powerful and engaging.
                        </p>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                          Key Benefits
                        </h2>
                        
                        <ul className="text-gray-700 mb-4 space-y-1">
                          <li>• Real-time AI suggestions for clarity and style</li>
                          <li>• Grammar and readability improvements</li>
                          <li>• Tone and voice optimization</li>
                          <li>• Professional writing enhancement</li>
                        </ul>
                        
                        <p className="text-gray-700">
                          {renderTextWithSuggestions('demo-3')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Suggestions Panel */}
              <div className="w-full lg:w-80">
                <Card className="shadow-lg border-0 bg-white h-fit">
                  <CardContent className="p-4 md:p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">AI Suggestions</h3>
                    {selectedSuggestion ? (
                      <div className="space-y-4">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            AI Suggestion
                          </Badge>
                          <p className="text-sm text-gray-600 mb-3">
                            {selectedSuggestion.explanation}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Original:</p>
                            <p className="text-sm bg-red-50 p-3 rounded border-l-2 border-red-200">
                              {selectedSuggestion.originalText}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Suggested:</p>
                            <p className="text-sm bg-green-50 p-3 rounded border-l-2 border-green-200">
                              {selectedSuggestion.suggestedText}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1" onClick={handleAcceptSuggestion}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={handleRejectSuggestion}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          Click a blue dot in the text to see an AI suggestion
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing; 