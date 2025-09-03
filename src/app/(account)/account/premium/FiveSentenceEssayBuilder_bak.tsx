'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { EssaySelector } from '@/components/ui/EssaySelector';
import { 
  Copy, RefreshCw, Download, Wand2, BookOpen, 
  TrendingUp, Award, AlertCircle, ChevronDown, ChevronUp,
  Edit3, Check, FileText, Layers, CheckCircle2, Circle
} from 'lucide-react';

interface ParagraphPart {
  type: 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';
  label: string;
  sentences: {
    sentence1: string;
    sentence2: string;
    sentence3: string;
    sentence4: string;
    sentence5: string;
  };
  generated: string;
  isEditing: boolean;
  isComplete: boolean;
}

interface EssayScore {
  overall: number;
  grade: string;
  feedback: string[];
  paragraphScores: {
    introduction?: number;
    body1?: number;
    body2?: number;
    body3?: number;
    conclusion?: number;
  };
}

interface FiveSentenceEssayBuilderProps {
  onTitleChange?: (title: string) => void;
}

export const FiveSentenceEssayBuilder: React.FC<FiveSentenceEssayBuilderProps> = ({ onTitleChange }) => {
  const [selectedEssayTitle, setSelectedEssayTitle] = useState<string>('');
  const [essayParts, setEssayParts] = useState<ParagraphPart[]>([
    {
      type: 'introduction',
      label: 'Introduction',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '', sentence5: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body1',
      label: 'Body Paragraph 1',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '', sentence5: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body2',
      label: 'Body Paragraph 2',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '', sentence5: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body3',
      label: 'Body Paragraph 3',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '', sentence5: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'conclusion',
      label: 'Conclusion',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '', sentence5: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    }
  ]);

  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [essayScore, setEssayScore] = useState<EssayScore | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [loadingEssay, setLoadingEssay] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentPart = essayParts[currentPartIndex];

  const getSentenceLabels = (type: string, sentenceNum: number) => {
    if (type === 'introduction') {
      switch(sentenceNum) {
        case 1: return { label: 'Hook', hint: 'Eye-catching opening - introduce the work and its central theme' };
        case 2: return { label: 'Lead-in', hint: 'Context and theoretical foundation - establish underlying concepts' };
        case 3: return { label: 'Thesis', hint: 'State your main argument clearly' };
        case 4: return { label: 'Elaboration', hint: 'Expand thesis complexity with sophisticated vocabulary' };
        case 5: return { label: 'Roadmap', hint: 'Preview three main arguments: first... second... finally...' };
      }
    } else if (type === 'conclusion') {
      switch(sentenceNum) {
        case 1: return { label: 'Restatement', hint: 'Restate thesis - what the work provides or accomplishes' };
        case 2: return { label: 'Summary', hint: 'Synthesize main arguments and key points' };
        case 3: return { label: 'Closing Thought', hint: 'Memorable ending with initial impact' };
        case 4: return { label: 'Universality', hint: 'Connect to broader human experience or societal patterns' };
        case 5: return { label: 'Resonance', hint: 'Final powerful insight that lingers with the reader' };
      }
    } else {
      // Body paragraphs - 4 foundation + 1 refinement
      switch(sentenceNum) {
        case 1: return { label: 'Topic Sentence', hint: 'State this paragraph\'s main argument' };
        case 2: return { label: 'Evidence/Quotes', hint: 'Provide direct quote or specific example' };
        case 3: return { label: 'Interpretation', hint: 'Explain what the evidence means' };
        case 4: return { label: 'Transition', hint: 'Connect to next point or paragraph' };
        case 5: return { label: 'Implication', hint: 'Reveal deeper significance with sophisticated vocabulary' };
      }
    }
    return { label: '', hint: '' };
  };

  const generateParagraph = (partIndex: number) => {
    const part = essayParts[partIndex];
    const sentences = Object.values(part.sentences);
    const nonEmptySentences = sentences.filter(s => s.trim());
    
    // Check if we have at least 3 sentences
    if (nonEmptySentences.length < 3) {
      alert(`Paragraph needs at least 3 sentences. Currently has ${nonEmptySentences.length}.`);
      return;
    }
    
    let paragraph = nonEmptySentences
      .map(s => {
        let sentence = s.trim();
        if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
          sentence += '.';
        }
        return sentence;
      })
      .join(' ');

    const newParts = [...essayParts];
    newParts[partIndex].generated = paragraph;
    newParts[partIndex].isComplete = true;
    setEssayParts(newParts);
  };

  const generateAllParagraphs = () => {
    const newParts = [...essayParts];
    let hasContent = false;
    let invalidParagraphs: string[] = [];
    
    essayParts.forEach((part, index) => {
      const sentences = Object.values(part.sentences);
      const nonEmptySentences = sentences.filter(s => s.trim());
      
      if (nonEmptySentences.length > 0) {
        // Check if paragraph has at least 3 sentences
        if (nonEmptySentences.length < 3) {
          invalidParagraphs.push(`${part.label} has only ${nonEmptySentences.length} sentence(s)`);
        } else {
          hasContent = true;
          const paragraph = nonEmptySentences
            .map(s => {
              let sentence = s.trim();
              if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
                sentence += '.';
              }
              return sentence;
            })
            .join(' ');
          
          newParts[index].generated = paragraph;
          newParts[index].isComplete = true;
        }
      }
    });
    
    if (invalidParagraphs.length > 0) {
      alert(`Some paragraphs need at least 3 sentences:\n${invalidParagraphs.join('\n')}`);
      return;
    }
    
    if (hasContent) {
      setEssayParts(newParts);
    }
  };

  const hasAnyContent = () => {
    return essayParts.some(part => 
      Object.values(part.sentences).some(s => s.trim())
    );
  };

  const toggleEditMode = (partIndex: number) => {
    const newParts = [...essayParts];
    newParts[partIndex].isEditing = !newParts[partIndex].isEditing;
    setEssayParts(newParts);
  };

  const updateGeneratedText = (partIndex: number, newText: string) => {
    const newParts = [...essayParts];
    newParts[partIndex].generated = newText;
    setEssayParts(newParts);
  };

  const clearPart = (partIndex: number) => {
    const newParts = [...essayParts];
    newParts[partIndex].sentences = { 
      sentence1: '', 
      sentence2: '', 
      sentence3: '', 
      sentence4: '',
      sentence5: ''
    };
    newParts[partIndex].generated = '';
    newParts[partIndex].isComplete = false;
    setEssayParts(newParts);
  };

  const clearAll = () => {
    setEssayParts(essayParts.map(part => ({
      ...part,
      sentences: { 
        sentence1: '', 
        sentence2: '', 
        sentence3: '', 
        sentence4: '',
        sentence5: ''
      },
      generated: '',
      isComplete: false,
      isEditing: false
    })));
    setEssayScore(null);
    setShowEvaluation(false);
  };

  const getFullEssay = () => {
    return essayParts
      .filter(part => part.isComplete && part.generated)
      .map(part => part.generated)
      .join('\n\n');
  };

  const evaluateFullEssay = () => {
    const completeParts = essayParts.filter(part => part.isComplete);
    if (completeParts.length === 0) return;

    let totalScore = 0;
    const paragraphScores: any = {};
    const feedback: string[] = [];

    completeParts.forEach(part => {
      const text = part.generated;
      const wordCount = text.split(' ').length;
      const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
      
      let score = 80; // Base score for paragraph
      
      // Check for proper sentence structure (3-5 sentences acceptable)
      console.log(`[Essay Evaluation] ${part.label}: ${sentenceCount} sentences detected`);
      
      if (sentenceCount >= 3 && sentenceCount <= 5) {
        score += 12; // Bonus for proper paragraph structure
        if (sentenceCount === 5) {
          score += 3; // Small extra bonus for full 5 sentences
        }
        // No feedback needed - sentence count is within acceptable range
      } else if (sentenceCount < 3) {
        feedback.push(`${part.label} has only ${sentenceCount} sentence(s) - minimum is 3`);
        score -= 15; // Penalty for too few sentences
      } else if (sentenceCount > 5) {
        feedback.push(`${part.label} has ${sentenceCount} sentences - maximum is 5`);
        score -= 5; // Minor penalty for too many sentences
      }
      
      // Academic vocabulary check - expanded based on PDF samples
      const academicWords = /\b(elicits?|indubitable|oligarchy|superlative|agitprop|effectuates?|physiognomy|dissidents?|inviolably|despotic|esoteric|diaspora|egregious|profligate|purview|disabuses?|provocative|institutionalized?|cyclical|perpetuation|rhetoric|enshrined|acquisitions?|necessit|decimation|determiner|upshot|enslavement|prejudice|insidious|displacement|irreconcilable|cynical|poignant|edict|aspirations?|immolation|subjugation|rampant|genealogy|proscribing|reclamation|fundamentalist|antiquated|dichotomy|hegemony|pervasive|atrocities|dismantled|vehemently|epitomizes?|facade|elusive|inherently|critique|obsession|dazzling|striking|remarkable|powerful|privilege|dismissive|dominant|exclusivity|decay|friction|rifts|unattainable|flawed|hollowness|disenchantment|reevaluate|allure|souls?|plausible|fragility|entrenched|yearning|validation|ingrained|superiority|pillar|steeped|arrogance|blatant|boasts?|moral|polished|societal|norms?|futile|gaze|epitomizes?|pursuit|underscores?|illuminates?|vivid|vividly|depicts?|tied|cost)\b/gi;
      const academicMatches = text.match(academicWords);
      if (academicMatches) {
        score += Math.min(15, academicMatches.length * 2.5);
      }
      
      // Structure-specific scoring
      if (part.type === 'introduction') {
        if (text.includes('talks about') || text.includes('explores') || text.includes('examines')) score += 3;
        if (text.match(/first[,:].*second[,:].*(?:finally|third)/i)) score += 5;
        if (wordCount > 80) score += 3;
        // Additional patterns from samples
        if (text.match(/\bwithin\s+(his|her|the)\s+(novel|book|work)\b/i)) score += 2;
        if (text.match(/\b(three|multiple)\s+\w*\s*points?\b/i)) score += 2;
      } else if (part.type === 'conclusion') {
        if (text.match(/\b(provides?|offers?|presents?|provocative|study|significance)\b/i)) score += 3;
        if (text.match(/\b(although|despite|however|nonetheless)\b/i)) score += 3;
        if (text.match(/\b(effectively|successfully|proves?|demonstrates?|masterfully)\b/i)) score += 4;
        // Additional patterns from samples
        if (text.match(/\b(lasting|broader|significance|impact|ultimately)\b/i)) score += 2;
      } else {
        // Body paragraphs
        if (text.includes('"') || text.includes("'")) score += 5;
        if (text.match(/\b(argues?|explains?|demonstrates?|reveals?|highlights?|sparks?)\b/i)) score += 3;
        if (text.match(/\b(however|furthermore|moreover|therefore|thus|nonetheless)\b/i)) score += 3;
        if (wordCount > 90) score += 3;
        // Additional patterns from samples
        if (text.match(/\b(notion|barriers?|extends?|crucial|undying|belief)\b/i)) score += 2;
        if (text.match(/\b(it is|it has become|this is)\b/i)) score += 1;
      }
      
      score = Math.min(100, score);
      paragraphScores[part.type] = score;
      totalScore += score;
    });

    const avgScore = Math.round(totalScore / completeParts.length);
    
    let grade = 'F';
    if (avgScore >= 95) grade = 'A+';
    else if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 85) grade = 'A-';
    else if (avgScore >= 82) grade = 'B+';
    else if (avgScore >= 78) grade = 'B';
    else if (avgScore >= 75) grade = 'B-';
    else if (avgScore >= 72) grade = 'C+';
    else if (avgScore >= 68) grade = 'C';
    else if (avgScore >= 65) grade = 'C-';
    else if (avgScore >= 60) grade = 'D';

    // Feedback
    if (completeParts.length === 5) {
      feedback.unshift('✅ Complete 5-paragraph structure achieved!');
      if (avgScore >= 90) {
        feedback.push('🌟 Excellent academic writing with sophisticated vocabulary!');
      }
    } else {
      feedback.unshift(`📝 ${5 - completeParts.length} paragraph(s) remaining`);
    }

    const allProperSentences = completeParts.every(part => {
      const count = part.generated.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
      return count >= 3 && count <= 5; // Accept 3-5 sentences as proper
    });

    if (allProperSentences && completeParts.length === 5) {
      feedback.push('🎯 Well-structured essay with proper paragraph development (3-5 sentences each)!');
    }

    setEssayScore({
      overall: avgScore,
      grade,
      feedback,
      paragraphScores
    });
  };

  const copyToClipboard = () => {
    const essay = getFullEssay();
    if (!essay) return;
    
    navigator.clipboard.writeText(essay);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const downloadEssay = () => {
    const essay = getFullEssay();
    if (!essay) return;
    
    const element = document.createElement('a');
    const file = new Blob([essay], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'essay-builder-output.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadEssayContent = async (essayId: string, essayTitle?: string) => {
    setLoadingEssay(true);
    try {
      const response = await fetch(`/api/essays/${essayId}`);
      if (response.ok) {
        const essayData = await response.json();
        
        // Set the essay title
        let finalTitle = '';
        if (essayTitle) {
          finalTitle = essayTitle;
        } else if (essayData.title) {
          finalTitle = essayData.title;
        } else if (essayData.book_title) {
          finalTitle = `Essay on ${essayData.book_title}`;
        }
        
        setSelectedEssayTitle(finalTitle);
        if (onTitleChange && finalTitle) {
          onTitleChange(finalTitle);
        }
        
        // Parse the essay content into our 5-paragraph structure
        if (essayData.paragraphs && essayData.paragraphs.length > 0) {
          const newParts = [...essayParts];
          
          // Map paragraphs to our structure
          essayData.paragraphs.forEach((paragraph: any, pIndex: number) => {
            if (pIndex < 5 && paragraph.sentences) {
              const sentences: any = {};
              
              // Map up to 5 sentences
              paragraph.sentences.slice(0, 5).forEach((sentence: any, sIndex: number) => {
                sentences[`sentence${sIndex + 1}`] = sentence.text || '';
              });
              
              // Fill remaining sentences if less than 5
              for (let i = paragraph.sentences.length; i < 5; i++) {
                sentences[`sentence${i + 1}`] = '';
              }
              
              newParts[pIndex].sentences = sentences;
            }
          });
          
          setEssayParts(newParts);
        }
      }
    } catch (error) {
      console.error('Error loading essay:', error);
    } finally {
      setLoadingEssay(false);
    }
  };

  const loadExample = () => {
    const examples = {
      introduction: {
        sentence1: "Between the World and Me talks about the essence of racial hierarchy and white power over American society",
        sentence2: "Throughout the book, Coates makes it clear that the state of any power, especially racial power, is derived from the fact that there are people on the bottom",
        sentence3: "The survival of Whitehood in America has long relied upon the state of being white as a pure and justifiable reason for the Wasps' preeminence",
        sentence4: "Coates elicits three agitprop points within his novel:",
        sentence5: "first, the institutionalized racism that effectuates cyclical poverty amongst African-Americans; second, Coates explains how the black body will always be subjugated to discrimination; finally, Coates attempts to explain to his son the double standard that society enforces"
      },
      body1: {
        sentence1: "The barriers that prevent Black Americans from achieving success is enshrined within the institutions that allow for the perpetuation of racist rhetoric within the justice system and education",
        sentence2: 'Coates argues within his novel "that the law has become an excuse for stopping and frisking you"',
        sentence3: "The notion that their very physiognomy has made them dissidents of the law entrench African-Americans into cyclical poverty",
        sentence4: "However, the warring debate behind America's institution extends further than law, it is the lack of proper education that ultimately binds black America",
        sentence5: 'Coates said it the best: "the pursuit of knowing [is] freedom," it is only education that can break African Americans out of the chains of colonial tyranny'
      },
      body2: {
        sentence1: "The American Dream has become a determiner of success, the upshot of which required years of African American enslavement and prejudice",
        sentence2: "However, Coates talks about something very crucial, and that is, this Dream was built as a product of colonial injustice",
        sentence3: 'It is the undying belief "that their possession of the Dream is the natural result of grit, honour, and good works," and ultimately a denial of their history',
        sentence4: "Coates sparks a deeply esoteric discussion, explaining that the black body was the means by which white power was established",
        sentence5: "Coates explains that it was black skin that sprung industries worth billions and that the power displacement between African Americans and whites will remain"
      },
      body3: {
        sentence1: "It has become clear in the last decade that the very genealogy that determines your family has become an indicator of your place on the pyramid racial hierarchy",
        sentence2: "Amongst the diaspora of African American's escaping from egregious countries, they are met with the reclamation of white power",
        sentence3: "Just as law has become an excuse for proscribing the black body, it has become an excuse to neglect African Americans' fundamental rights if they are not 'twice as good'",
        sentence4: "Coates tries to make his son realize that there will always be an irreconcilable difference between black America and white America",
        sentence5: "Instead of telling his son to fight the system he tells him that the only way to beat the system is by being 'twice as good'"
      },
      conclusion: {
        sentence1: "Between the World and Me provides a provocative study into the experience of being black in a white world",
        sentence2: "Although often viewed as cynical, Coates words purview the essence of African-American history and institutional profligate",
        sentence3: "Coates effectively disabuses any political understanding of racism and presents a deeply intellectual and poignant argument",
        sentence4: "The edict of critics was not wrong, Coates's understanding of the double standard within America proves inspiring",
        sentence5: "The aspirations of colonialism still remain today, as Coates masterfully demonstrates through his letter to his son"
      }
    };

    const newParts = [...essayParts];
    newParts[currentPartIndex].sentences = examples[currentPart.type] as any;
    setEssayParts(newParts);
  };

  const updateCurrentSentences = (field: string, value: string) => {
    const newParts = [...essayParts];
    newParts[currentPartIndex].sentences = {
      ...newParts[currentPartIndex].sentences,
      [field]: value
    };
    setEssayParts(newParts);
  };

  const completedCount = essayParts.filter(p => p.isComplete).length;

  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
      <div ref={contentRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
        {/* Progress Bar */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Flexible Essay Builder (3-5 Sentences)
            </h3>
            <span className="text-sm text-gray-600">
              {completedCount}/5 Paragraphs • 3-5 Sentences per Paragraph
            </span>
          </div>
          
          {/* Part Indicators */}
          <div className="flex gap-2 mb-3">
            {essayParts.map((part, index) => (
              <button
                key={index}
                onClick={() => setCurrentPartIndex(index)}
                className={`flex-1 p-2 rounded-lg border transition-all ${
                  currentPartIndex === index 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium mb-1">{part.label}</div>
                {part.isComplete && (
                  <Badge className="text-xs bg-green-100 text-green-700">Complete</Badge>
                )}
              </button>
            ))}
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Part Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between relative">
            <h3 className="font-semibold text-lg">
              Building: {currentPart.label}
            </h3>
            <div className="flex gap-3 items-center">
              <div className="w-46">
                <EssaySelector 
                  onSelectEssay={loadEssayContent}
                  placeholder="Select essay example"
                  className="w-full"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => clearPart(currentPartIndex)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Part
              </Button>
            </div>
          </div>

          {/* Requirement Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">ℹ️ Paragraph Requirements:</span> Each paragraph must have at least 3 sentences. 
              Sentences 4 and 5 are optional but recommended for fuller development.
            </p>
          </div>

          {/* 5 Sentence Inputs */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(num => {
              const { label, hint } = getSentenceLabels(currentPart.type, num);
              const fieldName = `sentence${num}`;
              const isOptional = num > 3;
              
              return (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentence {num}: {label} {isOptional && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
                    <span className="text-xs text-gray-500 ml-2">({hint})</span>
                  </label>
                  <Textarea
                    value={currentPart.sentences[fieldName as keyof typeof currentPart.sentences]}
                    onChange={(e) => updateCurrentSentences(fieldName, e.target.value)}
                    placeholder={hint}
                    rows={2}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => {
              if (hasAnyContent()) {
                generateAllParagraphs();
              } else {
                generateParagraph(currentPartIndex);
              }
            }}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Wand2 className="h-5 w-5" />
            {hasAnyContent() ? 'Generate Complete Essay' : `Generate ${currentPart.label}`}
          </Button>
        </div>

        {/* Generated Parts Display */}
        {essayParts.some(p => p.isComplete) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Generated Essay Parts</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={evaluateFullEssay}
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Evaluate Essay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={completedCount === 0}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copiedNotification ? 'Copied!' : 'Copy Essay'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadEssay}
                  disabled={completedCount === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {essayParts.map((part, index) => (
              part.isComplete && (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{part.label}</h4>
                      <Badge className="bg-green-100 text-green-700">
                        {part.generated.split(/[.!?]+/).filter(s => s.trim().length > 10).length} Sentences
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleEditMode(index)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {part.isEditing ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {part.isEditing ? (
                    <Textarea
                      value={part.generated}
                      onChange={(e) => updateGeneratedText(index, e.target.value)}
                      className="w-full"
                      rows={5}
                    />
                  ) : (
                    <p className="text-gray-800 leading-relaxed">{part.generated}</p>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Word Count:</strong> {part.generated.split(' ').length} words
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Essay Evaluation */}
        {essayScore && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Button
              variant="outline"
              onClick={() => setShowEvaluation(!showEvaluation)}
              className="w-full flex items-center justify-between mb-3"
              size="sm"
            >
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Essay Evaluation
                <Badge className={`ml-2 ${
                  essayScore.overall >= 80 ? 'bg-green-100 text-green-700' :
                  essayScore.overall >= 70 ? 'bg-blue-100 text-blue-700' :
                  essayScore.overall >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {essayScore.grade} ({essayScore.overall}%)
                </Badge>
              </span>
              {showEvaluation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {showEvaluation && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(essayScore.paragraphScores).map(([key, score]) => (
                    <div key={key} className="text-center p-2 bg-white rounded">
                      <div className="text-lg font-semibold">{score}%</div>
                      <div className="text-xs text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                {essayScore.feedback.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Feedback</h4>
                    <ul className="space-y-1">
                      {essayScore.feedback.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <AlertCircle className="h-3 w-3 mt-0.5 text-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Clear All Button - Positioned at the end */}
        {essayParts.some(p => p.isComplete || Object.values(p.sentences).some(s => s)) && (
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearAll}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All & Start Over
            </Button>
          </div>
        )}
      </div>

      {/* Tips Sidebar */}
      <div className="w-80 overflow-y-auto border-l pl-6">
        <div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center justify-between">
              Essay Structure Guide (3-5 Sentences)
              <button
                onClick={() => setShowTips(!showTips)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showTips ? 'Hide' : 'Show'}
              </button>
            </h3>
            
            {showTips && (
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Introduction</h4>
                  <ol className="text-xs text-gray-600 space-y-0.5">
                    <li>1. Hook - Eye-catching opening <span className="text-blue-600">(Required)</span></li>
                    <li>2. Lead-in - Context bridge <span className="text-blue-600">(Required)</span></li>
                    <li>3. Thesis - Main argument <span className="text-blue-600">(Required)</span></li>
                    <li>4. Elaboration - Complexity layer <span className="text-gray-400">(Optional)</span></li>
                    <li>5. Roadmap - Three-part preview <span className="text-gray-400">(Optional)</span></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Body Paragraphs</h4>
                  <ol className="text-xs text-gray-600 space-y-0.5">
                    <li>1. Topic Sentence <span className="text-blue-600">(Required)</span></li>
                    <li>2. Evidence/Quotes <span className="text-blue-600">(Required)</span></li>
                    <li>3. Interpretation <span className="text-blue-600">(Required)</span></li>
                    <li>4. Transition <span className="text-gray-400">(Optional)</span></li>
                    <li>5. Implication - Deeper significance <span className="text-gray-400">(Optional)</span></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Conclusion</h4>
                  <ol className="text-xs text-gray-600 space-y-0.5">
                    <li>1. Restatement <span className="text-blue-600">(Required)</span></li>
                    <li>2. Summary <span className="text-blue-600">(Required)</span></li>
                    <li>3. Closing Thought <span className="text-blue-600">(Required)</span></li>
                    <li>4. Universality - Broader scope <span className="text-gray-400">(Optional)</span></li>
                    <li>5. Resonance - Lasting impact <span className="text-gray-400">(Optional)</span></li>
                  </ol>
                </div>
              </div>
            )}
          </div>
          
          {/* Dynamic Progress Checklist */}
          <div className="bg-white p-4 rounded-lg border mt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress Checklist
            </h3>
            <div className="space-y-2">
              {/* Paragraph Progress */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {essayParts[0].isComplete ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={essayParts[0].isComplete ? 'text-green-700' : 'text-gray-600'}>
                    Introduction
                  </span>
                </div>
                
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {essayParts[i].isComplete ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={essayParts[i].isComplete ? 'text-green-700' : 'text-gray-600'}>
                      Body Paragraph {i}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 text-xs">
                  {essayParts[4].isComplete ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={essayParts[4].isComplete ? 'text-green-700' : 'text-gray-600'}>
                    Conclusion
                  </span>
                </div>
              </div>
              
              {/* Essay Features */}
              <div className="pt-2 mt-2 border-t space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {essayParts.some(p => p.generated.includes('"')) ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={essayParts.some(p => p.generated.includes('"')) ? 'text-green-700' : 'text-gray-600'}>
                    Includes quotations
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  {essayParts.filter(p => p.isComplete).length >= 3 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={essayParts.filter(p => p.isComplete).length >= 3 ? 'text-green-700' : 'text-gray-600'}>
                    Three body paragraphs
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  {completedCount === 5 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={completedCount === 5 ? 'text-green-700' : 'text-gray-600'}>
                    Complete structure (3-5 sentences per paragraph)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  {essayParts.filter(p => p.isComplete).every(p => 
                    p.generated.split(' ').length >= 80
                  ) && completedCount > 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={
                    essayParts.filter(p => p.isComplete).every(p => 
                      p.generated.split(' ').length >= 80
                    ) && completedCount > 0 ? 'text-green-700' : 'text-gray-600'
                  }>
                    80+ words per paragraph
                  </span>
                </div>
              </div>
              
              {/* Overall Progress */}
              <div className="pt-2 mt-2 border-t">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-blue-600 font-medium">
                    {Math.round((completedCount / 5) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(completedCount / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};