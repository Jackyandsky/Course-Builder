'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Search, AlertTriangle, CheckCircle, Info, X, FileText, Target, BookOpen, Link2, Sparkles } from 'lucide-react';
import nlp from 'compromise';

interface AnalysisResult {
  sentences: SentenceAnalysis[];
  structuralAnalysis: StructuralAnalysis;
  overallStats: {
    sentenceCount: number;
    wordCount: number;
    avgWordsPerSentence: number;
    readabilityScore: number;
    structuralIssues: StructuralIssue[];
  };
}

interface SentenceAnalysis {
  text: string;
  role: 'hook' | 'context' | 'thesis' | 'topic' | 'evidence' | 'analysis' | 'transition' | 'restatement' | 'summary' | 'closing' | 'unknown';
  stats: {
    wordCount: number;
    hasTransitionWord: boolean;
    hasEvidence: boolean;
    hasAnalysis: boolean;
  };
}

interface StructuralAnalysis {
  paragraphType: 'introduction' | 'body' | 'conclusion';
  hasProperStructure: boolean;
  structuralElements: {
    hook?: boolean;
    context?: boolean;
    thesis?: boolean;
    topicSentence?: boolean;
    evidence?: boolean;
    analysis?: boolean;
    transition?: boolean;
    restatement?: boolean;
    summary?: boolean;
    closing?: boolean;
  };
  coherenceScore: number;
  flowScore: number;
}

interface StructuralIssue {
  type: 'structure' | 'coherence' | 'flow' | 'organization';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  sentenceIndex?: number;
  suggestion?: string;
}

interface ParagraphAnalyzerProps {
  paragraph: string;
  isOpen: boolean;
  onClose: () => void;
}

// Transition words and phrases
const transitionWords = [
  'however', 'therefore', 'furthermore', 'moreover', 'consequently',
  'nevertheless', 'thus', 'hence', 'accordingly', 'subsequently',
  'meanwhile', 'alternatively', 'likewise', 'similarly', 'conversely',
  'in addition', 'in contrast', 'in conclusion', 'for example',
  'for instance', 'specifically', 'notably', 'particularly',
  'first', 'second', 'third', 'finally', 'next', 'then',
  'additionally', 'besides', 'equally', 'ultimately', 'overall'
];

// Hook indicators
const hookIndicators = [
  'imagine', 'consider', 'what if', 'have you ever', 'think about',
  'picture this', 'surprisingly', 'shockingly', 'remarkably',
  'did you know', 'according to', 'statistics show', 'research reveals'
];

// Evidence indicators
const evidenceIndicators = [
  'according to', 'research shows', 'studies indicate', 'data reveals',
  'evidence suggests', 'as stated', 'quote', '"', 'for example',
  'for instance', 'specifically', 'such as', 'including'
];

// Analysis indicators
const analysisIndicators = [
  'this shows', 'this demonstrates', 'this suggests', 'this indicates',
  'this reveals', 'this means', 'therefore', 'thus', 'consequently',
  'as a result', 'this highlights', 'this emphasizes', 'significantly',
  'importantly', 'notably', 'the significance'
];

export default function ParagraphAnalyzer({ paragraph, isOpen, onClose }: ParagraphAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && paragraph) {
      analyzeParagraph();
    }
  }, [isOpen, paragraph]);

  const detectParagraphType = (sentences: string[]): 'introduction' | 'body' | 'conclusion' => {
    const firstSentenceLower = sentences[0]?.toLowerCase() || '';
    const lastSentenceLower = sentences[sentences.length - 1]?.toLowerCase() || '';
    
    // Check for introduction indicators
    if (hookIndicators.some(indicator => firstSentenceLower.includes(indicator)) ||
        firstSentenceLower.includes('thesis') ||
        firstSentenceLower.includes('this essay') ||
        firstSentenceLower.includes('this paper')) {
      return 'introduction';
    }
    
    // Check for conclusion indicators
    if (firstSentenceLower.includes('in conclusion') ||
        firstSentenceLower.includes('to conclude') ||
        firstSentenceLower.includes('in summary') ||
        firstSentenceLower.includes('ultimately') ||
        firstSentenceLower.includes('therefore') ||
        firstSentenceLower.includes('thus')) {
      return 'conclusion';
    }
    
    // Default to body paragraph
    return 'body';
  };

  const analyzeSentenceRole = (sentence: string, index: number, total: number, paragraphType: string): SentenceAnalysis['role'] => {
    const sentenceLower = sentence.toLowerCase();
    
    if (paragraphType === 'introduction') {
      if (index === 0) return 'hook';
      if (index === 1) return 'context';
      if (index === 2) return 'thesis';
    } else if (paragraphType === 'conclusion') {
      if (index === 0) return 'restatement';
      if (index === 1) return 'summary';
      if (index === 2) return 'closing';
    } else { // body paragraph
      if (index === 0) return 'topic';
      if (index === 1 && evidenceIndicators.some(indicator => sentenceLower.includes(indicator))) return 'evidence';
      if (index === 2 && analysisIndicators.some(indicator => sentenceLower.includes(indicator))) return 'analysis';
      if (index === 3 || (index === total - 1 && transitionWords.some(word => sentenceLower.includes(word)))) return 'transition';
    }
    
    return 'unknown';
  };

  const analyzeParagraph = () => {
    const doc = nlp(paragraph);
    const sentences = doc.sentences().out('array');
    
    const paragraphType = detectParagraphType(sentences);
    
    const analyzedSentences: SentenceAnalysis[] = sentences.map((sentence: string, index: number) => {
      const sentenceLower = sentence.toLowerCase();
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      
      const role = analyzeSentenceRole(sentence, index, sentences.length, paragraphType);
      
      return {
        text: sentence,
        role,
        stats: {
          wordCount: words.length,
          hasTransitionWord: transitionWords.some(word => sentenceLower.includes(word)),
          hasEvidence: evidenceIndicators.some(indicator => sentenceLower.includes(indicator)),
          hasAnalysis: analysisIndicators.some(indicator => sentenceLower.includes(indicator))
        }
      };
    });
    
    // Analyze structural elements
    const structuralElements: StructuralAnalysis['structuralElements'] = {};
    
    if (paragraphType === 'introduction') {
      structuralElements.hook = analyzedSentences.some(s => s.role === 'hook');
      structuralElements.context = analyzedSentences.some(s => s.role === 'context');
      structuralElements.thesis = analyzedSentences.some(s => s.role === 'thesis');
    } else if (paragraphType === 'conclusion') {
      structuralElements.restatement = analyzedSentences.some(s => s.role === 'restatement');
      structuralElements.summary = analyzedSentences.some(s => s.role === 'summary');
      structuralElements.closing = analyzedSentences.some(s => s.role === 'closing');
    } else {
      structuralElements.topicSentence = analyzedSentences.some(s => s.role === 'topic');
      structuralElements.evidence = analyzedSentences.some(s => s.role === 'evidence' || s.stats.hasEvidence);
      structuralElements.analysis = analyzedSentences.some(s => s.role === 'analysis' || s.stats.hasAnalysis);
      structuralElements.transition = analyzedSentences.some(s => s.role === 'transition' || s.stats.hasTransitionWord);
    }
    
    // Calculate coherence and flow scores
    const coherenceScore = calculateCoherenceScore(analyzedSentences);
    const flowScore = calculateFlowScore(analyzedSentences);
    
    // Check for structural issues
    const structuralIssues: StructuralIssue[] = [];
    
    // Check expected sentence count
    const expectedSentenceCount = paragraphType === 'body' ? 4 : 3;
    if (sentences.length !== expectedSentenceCount) {
      structuralIssues.push({
        type: 'structure',
        severity: 'warning',
        message: `${paragraphType.charAt(0).toUpperCase() + paragraphType.slice(1)} paragraphs should have ${expectedSentenceCount} sentences. You have ${sentences.length}.`,
        suggestion: sentences.length < expectedSentenceCount ? 'Add more sentences to complete the structure.' : 'Consider condensing to the recommended number of sentences.'
      });
    }
    
    // Check for missing structural elements
    if (paragraphType === 'introduction') {
      if (!structuralElements.hook) {
        structuralIssues.push({
          type: 'structure',
          severity: 'error',
          message: 'Missing hook sentence to grab reader attention.',
          sentenceIndex: 0,
          suggestion: 'Start with an engaging question, surprising fact, or vivid description.'
        });
      }
      if (!structuralElements.thesis) {
        structuralIssues.push({
          type: 'structure',
          severity: 'error',
          message: 'Missing thesis statement.',
          sentenceIndex: 2,
          suggestion: 'End with a clear thesis that states your main argument.'
        });
      }
    } else if (paragraphType === 'body') {
      if (!structuralElements.evidence) {
        structuralIssues.push({
          type: 'structure',
          severity: 'warning',
          message: 'No evidence or examples detected.',
          suggestion: 'Include specific examples, quotes, or data to support your point.'
        });
      }
      if (!structuralElements.analysis) {
        structuralIssues.push({
          type: 'structure',
          severity: 'warning',
          message: 'Missing analysis or interpretation.',
          suggestion: 'Explain how your evidence supports your main point.'
        });
      }
      if (!structuralElements.transition && sentences.length >= 4) {
        structuralIssues.push({
          type: 'flow',
          severity: 'suggestion',
          message: 'Consider adding a transition to the next paragraph.',
          sentenceIndex: sentences.length - 1,
          suggestion: 'End with a sentence that links to your next point.'
        });
      }
    }
    
    // Check coherence
    if (coherenceScore < 60) {
      structuralIssues.push({
        type: 'coherence',
        severity: 'warning',
        message: 'Paragraph lacks coherence. Sentences don\'t flow logically.',
        suggestion: 'Ensure each sentence builds on the previous one.'
      });
    }
    
    // Check flow
    if (flowScore < 60) {
      structuralIssues.push({
        type: 'flow',
        severity: 'suggestion',
        message: 'Consider adding more transition words for better flow.',
        suggestion: 'Use transitional phrases to connect your ideas smoothly.'
      });
    }
    
    // Calculate overall statistics
    const totalWords = analyzedSentences.reduce((sum, s) => sum + s.stats.wordCount, 0);
    const avgWordsPerSentence = totalWords / analyzedSentences.length;
    
    // Simple readability score (Flesch Reading Ease approximation)
    const syllableCount = paragraph.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.replace(/[^aeiouAEIOU]/g, '').length);
    }, 0);
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - 1.015 * (totalWords / analyzedSentences.length) - 84.6 * (syllableCount / totalWords)
    ));
    
    setAnalysis({
      sentences: analyzedSentences,
      structuralAnalysis: {
        paragraphType,
        hasProperStructure: structuralIssues.filter(i => i.severity === 'error').length === 0,
        structuralElements,
        coherenceScore,
        flowScore
      },
      overallStats: {
        sentenceCount: analyzedSentences.length,
        wordCount: totalWords,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        readabilityScore: Math.round(readabilityScore),
        structuralIssues
      }
    });
  };

  const calculateCoherenceScore = (sentences: SentenceAnalysis[]): number => {
    let score = 100;
    
    // Check if roles follow expected order
    const expectedRoles: { [key: string]: string[] } = {
      introduction: ['hook', 'context', 'thesis'],
      body: ['topic', 'evidence', 'analysis', 'transition'],
      conclusion: ['restatement', 'summary', 'closing']
    };
    
    // Penalize for unknown roles
    const unknownCount = sentences.filter(s => s.role === 'unknown').length;
    score -= unknownCount * 20;
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateFlowScore = (sentences: SentenceAnalysis[]): number => {
    const transitionCount = sentences.filter(s => s.stats.hasTransitionWord).length;
    const expectedTransitions = Math.max(1, Math.floor(sentences.length / 2));
    
    return Math.min(100, (transitionCount / expectedTransitions) * 100);
  };

  const getRoleColor = (role: SentenceAnalysis['role']) => {
    switch (role) {
      case 'hook': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'context': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'thesis': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'topic': return 'bg-green-100 text-green-800 border-green-300';
      case 'evidence': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'transition': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'restatement': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'summary': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'closing': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getRoleIcon = (role: SentenceAnalysis['role']) => {
    switch (role) {
      case 'hook': return <Sparkles className="h-4 w-4" />;
      case 'context': return <BookOpen className="h-4 w-4" />;
      case 'thesis': return <Target className="h-4 w-4" />;
      case 'topic': return <FileText className="h-4 w-4" />;
      case 'evidence': return <Search className="h-4 w-4" />;
      case 'analysis': return <Info className="h-4 w-4" />;
      case 'transition': return <Link2 className="h-4 w-4" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Paragraph Structure Analysis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyze paragraph structure, coherence, and organization
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {analysis && (
            <div className="space-y-6">
              {/* Paragraph Type and Statistics */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold">Paragraph Overview</h3>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-900 capitalize">
                        {analysis.structuralAnalysis.paragraphType}
                      </div>
                      <div className="text-xs text-blue-600">Paragraph Type</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {analysis.overallStats.sentenceCount}
                      </div>
                      <div className="text-xs text-gray-600">Sentences</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {analysis.overallStats.wordCount}
                      </div>
                      <div className="text-xs text-gray-600">Words</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        analysis.structuralAnalysis.coherenceScore > 70 ? 'text-green-600' :
                        analysis.structuralAnalysis.coherenceScore > 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {analysis.structuralAnalysis.coherenceScore}%
                      </div>
                      <div className="text-xs text-gray-600">Coherence</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        analysis.structuralAnalysis.flowScore > 70 ? 'text-green-600' :
                        analysis.structuralAnalysis.flowScore > 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {analysis.structuralAnalysis.flowScore}%
                      </div>
                      <div className="text-xs text-gray-600">Flow</div>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Structural Elements Check */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Structural Elements
                  </h3>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(analysis.structuralAnalysis.structuralElements).map(([element, present]) => (
                      <div key={element} className={`p-3 rounded-lg border ${
                        present ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {present ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium capitalize ${
                            present ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {element.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              {/* Structural Issues */}
              {analysis.overallStats.structuralIssues.length > 0 && (
                <Card>
                  <Card.Header>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Structure Feedback
                    </h3>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {analysis.overallStats.structuralIssues.map((issue, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          issue.severity === 'error' ? 'bg-red-50 border-red-200' :
                          issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {issue.severity === 'error' ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            ) : issue.severity === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {issue.message}
                              </div>
                              {issue.suggestion && (
                                <div className="text-xs text-gray-600 mt-1">
                                  💡 {issue.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              )}

              {/* Sentence Structure Analysis */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold">Sentence-by-Sentence Structure</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-purple-100 text-purple-800">Hook</Badge>
                    <Badge className="bg-blue-100 text-blue-800">Context</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800">Thesis</Badge>
                    <Badge className="bg-green-100 text-green-800">Topic</Badge>
                    <Badge className="bg-orange-100 text-orange-800">Evidence</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">Analysis</Badge>
                    <Badge className="bg-pink-100 text-pink-800">Transition</Badge>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    {analysis.sentences.map((sentence, sIndex) => (
                      <div 
                        key={sIndex} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedSentence === sIndex ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSentence(selectedSentence === sIndex ? null : sIndex)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <span className="text-xs font-medium text-gray-500">S{sIndex + 1}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleColor(sentence.role)}`}>
                              {getRoleIcon(sentence.role)}
                              <span className="capitalize">{sentence.role}</span>
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {sentence.text}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <span>{sentence.stats.wordCount} words</span>
                              {sentence.stats.hasTransitionWord && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Has transition
                                </span>
                              )}
                              {sentence.stats.hasEvidence && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Contains evidence
                                </span>
                              )}
                              {sentence.stats.hasAnalysis && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Includes analysis
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              {/* Structure Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <Card.Header>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Expected Structure for {analysis.structuralAnalysis.paragraphType.charAt(0).toUpperCase() + analysis.structuralAnalysis.paragraphType.slice(1)} Paragraph
                  </h3>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2">
                    {analysis.structuralAnalysis.paragraphType === 'introduction' && (
                      <>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 1 (Hook):</strong> Grab attention with a compelling opening
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 2 (Context):</strong> Provide background information
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 3 (Thesis):</strong> State your main argument clearly
                        </div>
                      </>
                    )}
                    {analysis.structuralAnalysis.paragraphType === 'body' && (
                      <>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 1 (Topic):</strong> Introduce the paragraph's main point
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 2 (Evidence):</strong> Provide supporting details or quotes
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 3 (Analysis):</strong> Explain the significance
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 4 (Transition):</strong> Link to the next paragraph
                        </div>
                      </>
                    )}
                    {analysis.structuralAnalysis.paragraphType === 'conclusion' && (
                      <>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 1 (Restatement):</strong> Restate thesis in new words
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 2 (Summary):</strong> Synthesize main points
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Sentence 3 (Closing):</strong> End with a memorable thought
                        </div>
                      </>
                    )}
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}