'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Copy, RefreshCw, Download, Wand2, BookOpen, 
  TrendingUp, Award, AlertCircle, ChevronDown, ChevronUp,
  Edit3, Check, X, FileText
} from 'lucide-react';

interface ParagraphPart {
  type: 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';
  label: string;
  sentences: {
    sentence1: string;
    sentence2: string;
    sentence3: string;
    sentence4?: string;
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

export const EssayBuilderModal = () => {
  const [essayParts, setEssayParts] = useState<ParagraphPart[]>([
    {
      type: 'introduction',
      label: 'Introduction',
      sentences: { sentence1: '', sentence2: '', sentence3: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body1',
      label: 'Body Paragraph 1',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body2',
      label: 'Body Paragraph 2',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'body3',
      label: 'Body Paragraph 3',
      sentences: { sentence1: '', sentence2: '', sentence3: '', sentence4: '' },
      generated: '',
      isEditing: false,
      isComplete: false
    },
    {
      type: 'conclusion',
      label: 'Conclusion',
      sentences: { sentence1: '', sentence2: '', sentence3: '' },
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
  const contentRef = useRef<HTMLDivElement>(null);

  const currentPart = essayParts[currentPartIndex];

  const generateParagraph = (partIndex: number) => {
    const part = essayParts[partIndex];
    const { sentence1, sentence2, sentence3, sentence4 } = part.sentences;
    let paragraph = '';
    
    if (sentence1) {
      paragraph += sentence1.trim();
      if (!sentence1.endsWith('.')) paragraph += '.';
      paragraph += ' ';
    }

    if (sentence2) {
      paragraph += sentence2.trim();
      if (!sentence2.endsWith('.')) paragraph += '.';
      paragraph += ' ';
    }

    if (sentence3) {
      paragraph += sentence3.trim();
      if (!sentence3.endsWith('.') && !sentence3.endsWith('"')) paragraph += '.';
      paragraph += ' ';
    }

    if (part.type.startsWith('body') && sentence4) {
      paragraph += sentence4.trim();
      if (!sentence4.endsWith('.')) paragraph += '.';
    }

    const newParts = [...essayParts];
    newParts[partIndex].generated = paragraph.trim();
    newParts[partIndex].isComplete = true;
    setEssayParts(newParts);
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
      sentence4: newParts[partIndex].type.startsWith('body') ? '' : undefined 
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
        sentence4: part.type.startsWith('body') ? '' : undefined 
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

    // Advanced scoring with multiple criteria
    completeParts.forEach(part => {
      const text = part.generated;
      const wordCount = text.split(' ').length;
      const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
      
      let score = 70; // Base score
      
      // Structure scoring
      if (part.type === 'introduction') {
        if (sentenceCount >= 3) score += 10;
        if (wordCount > 50) score += 5;
        // Check for thesis elements
        if (text.match(/\b(through|exposes?|reveals?|demonstrates?|examines?|contrasts?)\b/i)) score += 8;
        // Hook quality
        if (text.match(/\b(dazzling|striking|remarkable|powerful|identity|wealth)\b/i)) score += 7;
      } else if (part.type === 'conclusion') {
        if (sentenceCount >= 3) score += 10;
        if (wordCount > 50) score += 5;
        // Check for synthesis elements
        if (text.match(/\b(ultimately|therefore|thus|finally)\b/i)) score += 8;
        // Restatement quality
        if (text.includes('Fitzgerald') || text.includes('Gatsby')) score += 7;
      } else {
        // Body paragraphs
        if (sentenceCount >= 4) score += 10;
        if (wordCount > 70) score += 5;
        // Evidence and quotes
        if (text.includes('"') || text.includes("'")) score += 8;
        // Analysis depth
        if (text.match(/\b(highlights?|demonstrates?|shows?|reveals?|underscores?)\b/i)) score += 7;
      }
      
      // Quality bonuses
      // Transition words
      if (text.match(/\b(however|therefore|furthermore|moreover|thus|despite|although)\b/i)) score += 3;
      // Complex sentence structures
      if (text.includes(',') && text.includes(' and ')) score += 2;
      // Literary language
      if (text.match(/\b(epitomizes?|facade|elusive|inherently|critique|obsession)\b/i)) score += 3;
      
      // Cap at 100
      score = Math.min(100, score);
      
      paragraphScores[part.type] = score;
      totalScore += score;
    });

    const avgScore = Math.round(totalScore / completeParts.length);
    
    let grade = 'F';
    if (avgScore >= 93) grade = 'A+';
    else if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 87) grade = 'A-';
    else if (avgScore >= 83) grade = 'B+';
    else if (avgScore >= 80) grade = 'B';
    else if (avgScore >= 77) grade = 'B-';
    else if (avgScore >= 73) grade = 'C+';
    else if (avgScore >= 70) grade = 'C';
    else if (avgScore >= 67) grade = 'C-';
    else if (avgScore >= 60) grade = 'D';

    // Detailed feedback based on score and completion
    if (completeParts.length === 5) {
      feedback.push('✅ Complete 5-paragraph essay structure achieved!');
      if (avgScore >= 90) {
        feedback.push('🌟 Outstanding essay! Excellent use of evidence and sophisticated analysis.');
        feedback.push('💪 Strong thesis development and compelling arguments throughout.');
      }
    } else {
      feedback.push(`📝 ${5 - completeParts.length} paragraph(s) still need to be completed`);
    }

    if (avgScore >= 95) {
      feedback.push('🏆 Exceptional work! Publishing-quality writing with masterful rhetoric.');
    } else if (avgScore >= 90) {
      feedback.push('⭐ Excellent essay with strong structure, evidence, and analysis.');
    } else if (avgScore >= 85) {
      feedback.push('👍 Very good essay with clear arguments and solid evidence.');
    } else if (avgScore >= 80) {
      feedback.push('✓ Good essay with room for deeper analysis or stronger transitions.');
    } else if (avgScore >= 70) {
      feedback.push('📚 Decent foundation - consider adding more specific evidence and analysis.');
    } else {
      feedback.push('💡 Keep developing your ideas with more detail and supporting evidence.');
    }

    // Specific paragraph feedback
    const scores = Object.values(paragraphScores) as number[];
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    
    if (maxScore - minScore > 15) {
      feedback.push('⚖️ Work on balancing the quality across all paragraphs.');
    }
    
    if (paragraphScores.introduction && paragraphScores.introduction < 80) {
      feedback.push('🎯 Strengthen your introduction with a more engaging hook.');
    }
    
    if (paragraphScores.conclusion && paragraphScores.conclusion < 80) {
      feedback.push('🎬 Enhance your conclusion with a more impactful closing thought.');
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
    element.download = 'complete-essay.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadExample = () => {
    const examples = {
      introduction: {
        sentence1: 'In the dazzling 1920s playground of Long Island, wealth was not just power, but a defining badge of identity',
        sentence2: 'Within F. Scott Fitzgerald\'s The Great Gatsby, the distinction between New Money and Old Money forms the backbone of the social divide',
        sentence3: 'Through vivid characters and dramatic settings, Fitzgerald contrasts the flashy pretensions of New Money with the entrenched power of Old Money, exposing the fragility of the American Dream'
      },
      body1: {
        sentence1: 'Jay Gatsby epitomizes the spirit of New Money, driven by ambition and the desire for social acceptance',
        sentence2: 'His extravagant parties are legendary, as Fitzgerald notes, "the air is alive with chatter and laughter..." reflecting his attempt to capture the attention of the elite',
        sentence3: 'These festivities highlight Gatsby\'s longing for a connection with Daisy Buchanan and the validation of Old Money society',
        sentence4: 'Despite Gatsby\'s wealth, his new money is no match for the ingrained superiority of the Buchanans\' old money'
      },
      body2: {
        sentence1: 'Tom Buchanan stands as a pillar of Old Money, steeped in privilege and traditional power',
        sentence2: 'His dismissive attitude is blatant when he boasts, "It\'s up to us, who are the dominant race, to watch out or these other races will have control..."',
        sentence3: 'Tom\'s arrogance demonstrates the exclusivity and moral decay beneath the polished facade of Old Money',
        sentence4: 'Such attitudes reveal not just personal biases but the societal norms that uphold these class distinctions'
      },
      body3: {
        sentence1: 'The friction between New and Old Money reveals deep societal rifts and questions the value assigned to wealth',
        sentence2: 'Gatsby\'s futile gaze across the bay towards the green light epitomizes his unattainable aspirations, "Gatsby believed in the green light..."',
        sentence3: 'This elusive pursuit underscores the novel\'s central critique of the American Dream as inherently flawed and unattainable',
        sentence4: 'As the story reaches its tragic conclusion, it becomes clear that these dreams, whether new or inherited, crash against reality\'s hard shores'
      },
      conclusion: {
        sentence1: 'In The Great Gatsby, Fitzgerald uses the contrasts between New Money and Old Money to illuminate the hollowness behind America\'s obsession with wealth',
        sentence2: 'Through characters like Gatsby and Tom Buchanan, the novel vividly depicts the illusions and disenchantment tied to both new and old wealth',
        sentence3: 'Ultimately, Fitzgerald\'s narrative asks us to reevaluate not just the allure of wealth, but its true cost on our souls and society'
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
    <div className="flex h-full">
      <div ref={contentRef} className="flex-1 space-y-4 pr-6 overflow-y-auto max-h-[70vh]">
        {/* Progress Bar */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Essay Progress
            </h3>
            <span className="text-sm text-gray-600">
              {completedCount}/5 Parts Complete
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Building: {currentPart.label}
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadExample}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Load Example
              </Button>
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

          {/* Sentence Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentence 1: {currentPart.type === 'introduction' ? 'Hook/Topic Introduction' : 
                            currentPart.type === 'conclusion' ? 'Synthesis/Restatement' : 
                            'Topic Sentence'}
                <span className="text-xs text-gray-500 ml-2">
                  {currentPart.type === 'introduction' ? '(Introduce book/topic and central theme)' : 
                   currentPart.type === 'conclusion' ? '(Summarize the work\'s significance)' : 
                   '(State this paragraph\'s main argument)'}
                </span>
              </label>
              <Textarea
                value={currentPart.sentences.sentence1}
                onChange={(e) => updateCurrentSentences('sentence1', e.target.value)}
                placeholder={currentPart.type === 'introduction' ? 
                           "Introduce the work and its central theme (e.g., 'Between the World and Me talks about...')" : 
                           currentPart.type === 'conclusion' ? 
                           "Provide a provocative summary (e.g., 'This work provides a study into...')" : 
                           "State your paragraph's main claim about institutional barriers, concepts, or themes..."}
                rows={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentence 2: {currentPart.type === 'introduction' ? 'Lead-In' : 
                            currentPart.type === 'conclusion' ? 'Summary' : 
                            'Evidence'}
              </label>
              <Textarea
                value={currentPart.sentences.sentence2}
                onChange={(e) => updateCurrentSentences('sentence2', e.target.value)}
                placeholder={currentPart.type === 'introduction' ? 
                           "Provide background or context..." : 
                           currentPart.type === 'conclusion' ? 
                           "Summarize your key arguments..." : 
                           "Add supporting evidence or detail..."}
                rows={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentence 3: {currentPart.type === 'introduction' ? 'Thesis' : 
                            currentPart.type === 'conclusion' ? 'Closing Thought' : 
                            'Analysis'}
              </label>
              <Textarea
                value={currentPart.sentences.sentence3}
                onChange={(e) => updateCurrentSentences('sentence3', e.target.value)}
                placeholder={currentPart.type === 'introduction' ? 
                           "State your main argument..." : 
                           currentPart.type === 'conclusion' ? 
                           "Leave a lasting impression..." : 
                           "Explain the significance..."}
                rows={2}
                className="w-full"
              />
            </div>

            {currentPart.type.startsWith('body') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sentence 4: Transition
                </label>
                <Textarea
                  value={currentPart.sentences.sentence4 || ''}
                  onChange={(e) => updateCurrentSentences('sentence4', e.target.value)}
                  placeholder="Link to the next point..."
                  rows={2}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Button
            onClick={() => generateParagraph(currentPartIndex)}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Wand2 className="h-5 w-5" />
            Generate {currentPart.label}
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
                      <Badge className="bg-green-100 text-green-700">Complete</Badge>
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
                      rows={4}
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearAll}
            className="flex-1"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Tips Sidebar */}
      <div className="w-80 border-l pl-6">
        <div className="sticky top-0">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center justify-between">
              5/5/5 Essay Structure
              <button
                onClick={() => setShowTips(!showTips)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showTips ? 'Hide' : 'Show'}
              </button>
            </h3>
            
            {showTips && (
              <div className="space-y-3 text-sm">
                <div className="p-2 bg-yellow-50 rounded">
                  <h4 className="font-medium text-yellow-900 mb-1 text-xs">Essay Overview</h4>
                  <p className="text-xs text-yellow-700">
                    Build a complete 5-paragraph essay: Introduction, 3 Body Paragraphs, and Conclusion.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Structure</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>📝 <strong>Introduction:</strong> 3 sentences</li>
                    <li>📝 <strong>Body 1-3:</strong> 4 sentences each</li>
                    <li>📝 <strong>Conclusion:</strong> 3 sentences</li>
                    <li className="pt-1 font-medium">Total: 18 sentences</li>
                  </ul>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-2">Building Process</h4>
                  <ol className="text-xs text-gray-600 space-y-1">
                    <li>1. Build each paragraph separately</li>
                    <li>2. Edit generated content as needed</li>
                    <li>3. Complete all 5 parts</li>
                    <li>4. Evaluate the full essay</li>
                    <li>5. Copy or download complete essay</li>
                  </ol>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-1">Tips</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>💡 Use examples for guidance</li>
                    <li>💡 Edit paragraphs after generation</li>
                    <li>💡 Ensure smooth transitions</li>
                    <li>💡 Maintain consistent tone</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};