'use client';

import { useState } from 'react';
import { Card, Button, Input, Textarea, Badge } from '@/components/ui';
import { Copy, RefreshCw, Download, Wand2, BookOpen, PenTool, TrendingUp, Award, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ParagraphTemplate {
  sentence1: string;
  sentence2: string;
  sentence3: string;
  sentence4?: string; // Only for body paragraphs
}

type ParagraphType = 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';

interface ParagraphScore {
  overall: number;
  // Introduction specific metrics
  hookStrength?: number;        // How engaging is the opening
  contextClarity?: number;      // How well context is provided
  thesisQuality?: number;       // How clear and strong is the thesis
  
  // Body paragraph specific metrics  
  topicRelevance?: number;      // How well topic sentence relates to thesis
  evidenceQuality?: number;     // Quality of quotes/supporting details
  analysisDepth?: number;       // How well evidence is interpreted
  transitionFlow?: number;      // How smooth is the transition
  
  // Conclusion specific metrics
  thesisRestatement?: number;   // How well thesis is restated
  synthesisQuality?: number;    // How well main points are summarized
  impactStrength?: number;      // How memorable is the closing
  
  grade: string;
  feedback: string[];
  metrics: Array<{name: string; score: number; max: number}>;
}

export default function ParagraphGeneratorPage() {
  const [template, setTemplate] = useState<ParagraphTemplate>({
    sentence1: '',
    sentence2: '',
    sentence3: '',
    sentence4: ''
  });

  const [paragraphType, setParagraphType] = useState<ParagraphType>('introduction');
  const [generatedParagraph, setGeneratedParagraph] = useState('');
  const [showTips, setShowTips] = useState(true);
  const [paragraphScore, setParagraphScore] = useState<ParagraphScore | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const generateParagraphFromTemplate = () => {
    const { sentence1, sentence2, sentence3, sentence4 } = template;
    let paragraph = '';
    
    // Add sentences based on paragraph type
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

    // Sentence 4 only for body paragraphs
    if (paragraphType.startsWith('body') && sentence4) {
      paragraph += sentence4.trim();
      if (!sentence4.endsWith('.')) paragraph += '.';
    }

    setGeneratedParagraph(paragraph.trim());
    
    // Calculate and set the score
    const score = evaluateParagraph(template, paragraph.trim());
    setParagraphScore(score);
  };

  const generateParagraph = () => {
    generateParagraphFromTemplate();
  };

  const evaluateParagraph = (template: ParagraphTemplate, paragraph: string): ParagraphScore => {
    const feedback: string[] = [];
    const metrics: Array<{name: string; score: number; max: number}> = [];
    let score: ParagraphScore;

    // Count sentences more accurately
    // Handle multiple punctuation marks and ensure proper sentence counting
    const cleanedParagraph = paragraph
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single
      .replace(/[!?]+/g, '.') // Treat ! and ? as sentence endings
      .trim();
    
    // Split by sentence-ending punctuation followed by space or end of string
    const sentences = cleanedParagraph
      .split(/\.(?:\s+|$)/)
      .filter(s => s.trim().length > 10); // Filter out very short fragments
    
    const sentenceCount = sentences.length;
    
    // Expected sentence count based on paragraph type
    const expectedCount = paragraphType.startsWith('body') ? 4 : 3;

    // Evaluate based on paragraph type with specific metrics
    if (paragraphType === 'introduction') {
      // Introduction evaluation
      let hookStrength = 0;
      let contextClarity = 0;
      let thesisQuality = 0;
      
      // Evaluate Hook (S1) - max 33 points
      if (template.sentence1) {
        hookStrength = 28; // Higher base points for having a hook
        // Check for engaging elements
        if (template.sentence1.length > 40) hookStrength += 2;
        if (template.sentence1.length > 60) hookStrength += 1;
        if (template.sentence1.includes('?') || template.sentence1.includes('!') || 
            template.sentence1.match(/\b(dazzling|striking|remarkable|powerful|extraordinary|playground|identity)\b/i)) hookStrength += 2;
      } else {
        feedback.push('Missing Hook - need an eye-catching opening');
      }
      
      // Evaluate Context (S2) - max 33 points
      if (template.sentence2) {
        contextClarity = 28; // Higher base points
        if (template.sentence2.includes('within') || template.sentence2.includes('through') || 
            template.sentence2.includes('between')) contextClarity += 3;
        if (template.sentence2.length > 40) contextClarity += 2;
      } else {
        feedback.push('Missing Lead-in Sentences - provide context');
      }

      // Evaluate Thesis (S3) - max 34 points
      if (template.sentence3) {
        thesisQuality = 29; // Higher base points
        if (template.sentence3.includes(',')) thesisQuality += 2;
        if (template.sentence3.match(/\b(explores?|examines?|reveals?|demonstrates?|contrasts?|exposes?|exposes?)\b/i)) thesisQuality += 3;
      } else {
        feedback.push('Missing Thesis Sentence - state your main argument');
      }
      
      metrics.push(
        {name: 'Hook Strength', score: Math.round(hookStrength), max: 33},
        {name: 'Context Clarity', score: Math.round(contextClarity), max: 33},
        {name: 'Thesis Quality', score: Math.round(thesisQuality), max: 34}
      );
      
      score = {
        overall: Math.round(hookStrength + contextClarity + thesisQuality),
        hookStrength,
        contextClarity,
        thesisQuality,
        grade: '',
        feedback,
        metrics
      };
      
    } else if (paragraphType === 'conclusion') {
      // Conclusion evaluation
      let thesisRestatement = 0;
      let synthesisQuality = 0;
      let impactStrength = 0;
      
      // Evaluate Restatement (S1) - max 33 points
      if (template.sentence1) {
        thesisRestatement = 28; // Higher base points
        if (template.sentence1.includes('Fitzgerald') || template.sentence1.includes('novel') || 
            template.sentence1.includes('uses') || template.sentence1.includes('contrast')) thesisRestatement += 3;
        if (template.sentence1.length > 40) thesisRestatement += 2;
      } else {
        feedback.push('Missing Restatement of Thesis');
      }
      
      // Evaluate Summary (S2) - max 33 points
      if (template.sentence2) {
        synthesisQuality = 28; // Higher base points
        if (template.sentence2.includes('through') || template.sentence2.includes('both') || 
            template.sentence2.includes('depicts')) synthesisQuality += 3;
        if (template.sentence2.length > 40) synthesisQuality += 2;
      } else {
        feedback.push('Missing Summary of Main Points');
      }

      // Evaluate Closing (S3) - max 34 points  
      if (template.sentence3) {
        impactStrength = 29; // Higher base points
        if (template.sentence3.match(/\b(ultimately|therefore|thus|finally|asks|reevaluate)\b/i)) impactStrength += 3;
        if (template.sentence3.includes('?') || template.sentence3.includes('!') || 
            template.sentence3.includes('society')) impactStrength += 2;
      } else {
        feedback.push('Missing Closing Thought or Reflection');
      }
      
      metrics.push(
        {name: 'Thesis Restatement', score: Math.round(thesisRestatement), max: 33},
        {name: 'Synthesis Quality', score: Math.round(synthesisQuality), max: 33},
        {name: 'Impact Strength', score: Math.round(impactStrength), max: 34}
      );
      
      score = {
        overall: Math.round(thesisRestatement + synthesisQuality + impactStrength),
        thesisRestatement,
        synthesisQuality,
        impactStrength,
        grade: '',
        feedback,
        metrics
      };
      
    } else {
      // Body paragraphs evaluation
      let topicRelevance = 0;
      let evidenceQuality = 0;
      let analysisDepth = 0;
      let transitionFlow = 0;
      
      // Evaluate Topic Sentence (S1) - max 25 points
      if (template.sentence1) {
        topicRelevance = 22; // Higher base points
        if (template.sentence1.length > 30) topicRelevance += 2;
        if (template.sentence1.match(/\b(epitomizes?|demonstrates?|reveals?|stands?|spirit|pillar|friction)\b/i)) topicRelevance += 1;
      } else {
        feedback.push('Missing Topic Sentence - set the stage for the paragraph');
      }
      
      // Evaluate Evidence (S2) - max 25 points
      if (template.sentence2) {
        evidenceQuality = 22; // Higher base points
        if (template.sentence2.includes('"') || template.sentence2.includes("'")) evidenceQuality += 2;
        if (template.sentence2.includes('as') || template.sentence2.includes('when') || 
            template.sentence2.includes('notes')) evidenceQuality += 1;
      } else {
        feedback.push('Missing Supporting Details & Quotations');
      }

      // Evaluate Interpretation (S3) - max 25 points
      if (template.sentence3) {
        analysisDepth = 22; // Higher base points
        if (template.sentence3.match(/\b(highlights?|demonstrates?|shows?|reveals?|underscores?|critique)\b/i)) analysisDepth += 2;
        if (template.sentence3.length > 40) analysisDepth += 1;
      } else {
        feedback.push('Missing Interpretation - explain significance');
      }

      // Evaluate Transition (S4) - max 25 points
      if (template.sentence4) {
        transitionFlow = 22; // Higher base points
        if (template.sentence4.match(/\b(despite|however|such|therefore|thus|becomes|clear)\b/i)) transitionFlow += 2;
        if (template.sentence4.includes('next') || template.sentence4.includes('becomes') || 
            template.sentence4.includes('match')) transitionFlow += 1;
      } else {
        feedback.push('Missing Transition Sentence - link to next paragraph');
      }
      
      metrics.push(
        {name: 'Topic Relevance', score: Math.round(topicRelevance), max: 25},
        {name: 'Evidence Quality', score: Math.round(evidenceQuality), max: 25},
        {name: 'Analysis Depth', score: Math.round(analysisDepth), max: 25},
        {name: 'Transition Flow', score: Math.round(transitionFlow), max: 25}
      );
      
      score = {
        overall: Math.round(topicRelevance + evidenceQuality + analysisDepth + transitionFlow),
        topicRelevance,
        evidenceQuality,
        analysisDepth,
        transitionFlow,
        grade: '',
        feedback,
        metrics
      };
    }
    
    // Check sentence count
    if (sentenceCount !== expectedCount) {
      feedback.push(`Paragraph has ${sentenceCount} sentences, expected ${expectedCount}`);
    }
    
    // Determine grade based on overall score
    let grade = 'F';
    if (score.overall >= 90) grade = 'A';
    else if (score.overall >= 80) grade = 'B';
    else if (score.overall >= 70) grade = 'C';
    else if (score.overall >= 60) grade = 'D';
    
    score.grade = grade;

    // Add positive feedback based on paragraph type
    if (score.overall >= 95) {
      if (paragraphType === 'introduction') {
        feedback.unshift('Outstanding introduction! Masterful hook and compelling thesis.');
      } else if (paragraphType === 'conclusion') {
        feedback.unshift('Exceptional conclusion! Powerfully synthesizes and resonates.');
      } else {
        feedback.unshift(`Excellent Body Paragraph ${paragraphType.slice(-1)}! Sophisticated argument with strong evidence.`);
      }
    } else if (score.overall >= 90) {
      if (paragraphType === 'introduction') {
        feedback.unshift('Excellent introduction! Strong hook and clear thesis.');
      } else if (paragraphType === 'conclusion') {
        feedback.unshift('Powerful conclusion! Effectively wraps up your argument.');
      } else {
        feedback.unshift(`Strong Body Paragraph ${paragraphType.slice(-1)}! Well-developed argument with good evidence.`);
      }
    } else if (score.overall >= 80) {
      if (paragraphType === 'introduction') {
        feedback.unshift('Good introduction, but could use a stronger hook or clearer thesis');
      } else if (paragraphType === 'conclusion') {
        feedback.unshift('Decent conclusion, but consider a more impactful closing thought');
      } else {
        feedback.unshift('Good body paragraph with room for stronger evidence or transitions');
      }
    } else if (score.overall >= 70) {
      feedback.unshift('Paragraph shows promise but needs more development in key areas');
    } else if (score.overall >= 60) {
      feedback.unshift('Paragraph needs significant improvement - review the structure requirements');
    }

    // Add specific tips based on paragraph type
    if (paragraphType === 'introduction' && score.overall < 80) {
      if (!template.sentence1 || template.sentence1.length < 50) {
        feedback.push('Tip: Start with a compelling hook to grab reader attention');
      }
      if (!template.sentence3 || !template.sentence3.includes(',')) {
        feedback.push('Tip: Your thesis should clearly state your main argument');
      }
    } else if (paragraphType === 'conclusion' && score.overall < 80) {
      if (!template.sentence1) {
        feedback.push('Tip: Restate your thesis in fresh words, not copy it');
      }
      if (!template.sentence3) {
        feedback.push('Tip: End with a thought-provoking statement or call to action');
      }
    } else if (paragraphType.startsWith('body') && score.overall < 80) {
      if (!template.sentence2 || !template.sentence2.includes('"')) {
        feedback.push('Tip: Include quotes or specific evidence in sentence 2');
      }
      if (!template.sentence4) {
        feedback.push('Tip: Always end body paragraphs with a transition');
      }
    }

    return score;
  };


  const clearAll = () => {
    setTemplate({
      sentence1: '',
      sentence2: '',
      sentence3: '',
      sentence4: ''
    });
    setGeneratedParagraph('');
    setParagraphScore(null);
    setShowEvaluation(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedParagraph);
    // You could add a toast notification here
  };

  const downloadParagraph = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedParagraph], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'generated-paragraph.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadExample = () => {
    // Load example based on paragraph type
    if (paragraphType === 'introduction') {
      setTemplate({
        sentence1: 'In the dazzling 1920s playground of Long Island, wealth was not just power, but a defining badge of identity',
        sentence2: 'Within F. Scott Fitzgerald\'s The Great Gatsby, the distinction between New Money and Old Money forms the backbone of the social divide',
        sentence3: 'Through vivid characters and dramatic settings, Fitzgerald contrasts the flashy pretensions of New Money with the entrenched power of Old Money, exposing the fragility of the American Dream',
        sentence4: ''
      });
    } else if (paragraphType === 'body1') {
      setTemplate({
        sentence1: 'Jay Gatsby epitomizes the spirit of New Money, driven by ambition and the desire for social acceptance',
        sentence2: 'His extravagant parties are legendary, as Fitzgerald notes, "the air is alive with chatter and laughter..." reflecting his attempt to capture the attention of the elite',
        sentence3: 'These festivities highlight Gatsby\'s longing for a connection with Daisy Buchanan and the validation of Old Money society',
        sentence4: 'Despite Gatsby\'s wealth, his new money is no match for the ingrained superiority of the Buchanans\' old money'
      });
    } else if (paragraphType === 'body2') {
      setTemplate({
        sentence1: 'Tom Buchanan stands as a pillar of Old Money, steeped in privilege and traditional power',
        sentence2: 'His dismissive attitude is blatant when he boasts, "It\'s up to us, who are the dominant race, to watch out or these other races will have control..."',
        sentence3: 'Tom\'s arrogance demonstrates the exclusivity and moral decay beneath the polished facade of Old Money',
        sentence4: 'Such attitudes reveal not just personal biases but the societal norms that uphold these class distinctions'
      });
    } else if (paragraphType === 'body3') {
      setTemplate({
        sentence1: 'The friction between New and Old Money reveals deep societal rifts and questions the value assigned to wealth',
        sentence2: 'Gatsby\'s futile gaze across the bay towards the green light epitomizes his unattainable aspirations, "Gatsby believed in the green light..."',
        sentence3: 'This elusive pursuit underscores the novel\'s central critique of the American Dream as inherently flawed and unattainable',
        sentence4: 'As the story reaches its tragic conclusion, it becomes clear that these dreams, whether new or inherited, crash against reality\'s hard shores'
      });
    } else if (paragraphType === 'conclusion') {
      setTemplate({
        sentence1: 'In The Great Gatsby, Fitzgerald uses the contrasts between New Money and Old Money to illuminate the hollowness behind America\'s obsession with wealth',
        sentence2: 'Through characters like Gatsby and Tom Buchanan, the novel vividly depicts the illusions and disenchantment tied to both new and old wealth',
        sentence3: 'Ultimately, Fitzgerald\'s narrative asks us to reevaluate not just the allure of wealth, but its true cost on our souls and society',
        sentence4: ''
      });
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <PenTool className="h-10 w-10 text-blue-600" />
              5/5/5 Paragraph Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build perfectly structured 5-sentence paragraphs for essays using the 5/5/5 Essay Format.
            </p>
            {/* Paragraph Type Selector */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <label className="text-sm font-medium text-gray-700">Paragraph Type:</label>
              <select
                value={paragraphType}
                onChange={(e) => {
                  setParagraphType(e.target.value as ParagraphType);
                  // Clear the template when switching paragraph types
                  setTemplate({
                    sentence1: '',
                    sentence2: '',
                    sentence3: '',
                    sentence4: ''
                  });
                  setGeneratedParagraph('');
                  setParagraphScore(null);
                  setShowEvaluation(false);
                }}
                className="px-3 pr-8 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="introduction">Introduction</option>
                <option value="body1">Body Paragraph 1</option>
                <option value="body2">Body Paragraph 2</option>
                <option value="body3">Body Paragraph 3</option>
                <option value="conclusion">Conclusion</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Template Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">5/5/5 Template</h2>
                  <div className="flex gap-2 mt-2">
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
                      onClick={clearAll}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      {paragraphType === 'introduction' ? '3-Sentence Introduction' : 
                       paragraphType === 'conclusion' ? '3-Sentence Conclusion' : 
                       `4-Sentence Body Paragraph ${paragraphType.slice(-1)}`}
                    </p>
                  </div>

                      {/* Sentence 1: Topic */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sentence 1: {paragraphType === 'introduction' ? 'Hook' : 
                                      paragraphType === 'conclusion' ? 'Restatement of Thesis' : 
                                      'Topic Sentence'}
                          <span className="text-xs text-gray-500 ml-2">
                            {paragraphType === 'introduction' ? '(Eye-catching opening)' : 
                             paragraphType === 'conclusion' ? '(Reinforce main argument)' : 
                             '(Introduce main idea)'}
                          </span>
                        </label>
                        <Textarea
                          value={template.sentence1}
                          onChange={(e) => setTemplate({...template, sentence1: e.target.value})}
                          placeholder={paragraphType === 'introduction' ? 
                                      "Start with a strong, memorable opening..." : 
                                      paragraphType === 'conclusion' ? 
                                      "Restate your thesis in fresh words..." : 
                                      "Introduce this paragraph's main point..."}
                          rows={2}
                        />
                      </div>

                      {/* Sentence 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sentence 2: {paragraphType === 'introduction' ? 'Lead-In Sentences' : 
                                      paragraphType === 'conclusion' ? 'Summary of Main Points' : 
                                      'Supporting Details & Quotations'}
                          <span className="text-xs text-gray-500 ml-2">
                            {paragraphType === 'introduction' ? '(Provide context)' : 
                             paragraphType === 'conclusion' ? '(Key insights from body)' : 
                             '(Integrate quote or evidence)'}
                          </span>
                        </label>
                        <Textarea
                          value={template.sentence2}
                          onChange={(e) => setTemplate({...template, sentence2: e.target.value})}
                          placeholder={paragraphType === 'introduction' ? 
                                      "Provide background or context..." : 
                                      paragraphType === 'conclusion' ? 
                                      "Summarize your key arguments..." : 
                                      "Add supporting evidence or detail..."}
                          rows={2}
                        />
                      </div>

                      {/* Sentence 3 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sentence 3: {paragraphType === 'introduction' ? 'Thesis Sentence' : 
                                      paragraphType === 'conclusion' ? 'Closing Thought/Reflection' : 
                                      'Interpretation'}
                          <span className="text-xs text-gray-500 ml-2">
                            {paragraphType === 'introduction' ? '(Present main argument)' : 
                             paragraphType === 'conclusion' ? '(Final thought-provoking statement)' : 
                             '(Explain significance)'}
                          </span>
                        </label>
                        <Textarea
                          value={template.sentence3}
                          onChange={(e) => setTemplate({...template, sentence3: e.target.value})}
                          placeholder={paragraphType === 'introduction' ? 
                                      "Connect your hook to the thesis..." : 
                                      paragraphType === 'conclusion' ? 
                                      "Explain broader significance..." : 
                                      "Include a quote or specific evidence..."}
                          rows={2}
                        />
                      </div>

                      {/* Sentence 4: Only for Body Paragraphs */}
                      {paragraphType.startsWith('body') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sentence 4: Transition
                            <span className="text-xs text-gray-500 ml-2">
                              (Conclude or link to next paragraph)
                            </span>
                          </label>
                          <Textarea
                            value={template.sentence4 || ''}
                            onChange={(e) => setTemplate({...template, sentence4: e.target.value})}
                            placeholder="Transition to the next point or conclude this paragraph..."
                            rows={2}
                          />
                        </div>
                      )}

                  {/* Generate Button */}
                  <div className="pt-4">
                    <Button
                      onClick={generateParagraph}
                      className="w-full flex items-center justify-center gap-2"
                      size="lg"
                    >
                      <Wand2 className="h-5 w-5" />
                      Generate Paragraph
                    </Button>
                  </div>
                </Card.Content>
              </Card>

              {/* Generated Output */}
              {generatedParagraph && (
                <div className="space-y-4">
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-semibold">Generated Paragraph</h3>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadParagraph}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {generatedParagraph}
                        </p>
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        <strong>Word Count:</strong> {generatedParagraph.split(' ').length} words
                      </div>
                    </Card.Content>
                  </Card>

                  {/* Evaluation Toggle Button */}
                  {paragraphScore && (
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowEvaluation(!showEvaluation)}
                        className="w-full flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-blue-600" />
                          View Paragraph Evaluation
                          <Badge className={`ml-2 ${
                            paragraphScore.overall >= 80 ? 'bg-green-100 text-green-700' :
                            paragraphScore.overall >= 70 ? 'bg-blue-100 text-blue-700' :
                            paragraphScore.overall >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {paragraphScore.grade} ({paragraphScore.overall}%)
                          </Badge>
                        </span>
                        {showEvaluation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                  {/* Score and Evaluation Card */}
                  {showEvaluation && (
                    <Card className="border-2 border-blue-200">
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            Paragraph Evaluation
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className={`text-3xl font-bold ${
                                paragraphScore.overall >= 80 ? 'text-green-600' :
                                paragraphScore.overall >= 70 ? 'text-blue-600' :
                                paragraphScore.overall >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {paragraphScore.overall}%
                              </div>
                              <div className="text-xs text-gray-500">Overall Score</div>
                            </div>
                            <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${
                              paragraphScore.grade === 'A' ? 'bg-green-100 text-green-700' :
                              paragraphScore.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              paragraphScore.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              paragraphScore.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {paragraphScore.grade}
                            </div>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Content>
                        {/* Score Breakdown - Section Specific Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          {paragraphScore.metrics.map((metric, index) => (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-xl font-semibold text-gray-700">
                                {metric.score}/{metric.max}
                              </div>
                              <div className="text-xs text-gray-500">{metric.name}</div>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bars for Section-Specific Metrics */}
                        <div className="space-y-3 mb-6">
                          {paragraphScore.metrics.map((metric, index) => {
                            const percentage = (metric.score / metric.max) * 100;
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                            const color = colors[index % colors.length];
                            
                            return (
                              <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600">{metric.name}</span>
                                  <span className="text-gray-700 font-medium">{Math.round(percentage)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${color} transition-all`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Feedback */}
                        {paragraphScore.feedback.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Feedback & Suggestions
                            </h4>
                            <ul className="space-y-2">
                              {paragraphScore.feedback.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                    item.includes('Excellent') || item.includes('Good') 
                                      ? 'text-green-500' 
                                      : 'text-yellow-500'
                                  }`} />
                                  <span className="text-gray-700">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tips Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <Card.Header>
                  <h3 className="text-lg font-semibold">Writing Tips</h3>
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showTips ? 'Hide' : 'Show'} Tips
                  </button>
                </Card.Header>
                {showTips && (
                  <Card.Content className="space-y-4">
                    <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-900 mb-1">5/5/5 Essay Format</h4>
                      <p className="text-xs text-yellow-700">
                        5 paragraphs total: Introduction (3 sentences), Body 1-3 (4 sentences each), Conclusion (3 sentences).
                      </p>
                    </div>

                    {paragraphType === 'introduction' && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Introduction Structure (3 Sentences)</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>S1:</strong> Hook - Eye-catching opening</li>
                            <li><strong>S2:</strong> Lead-in Sentences - Context/background</li>
                            <li><strong>S3:</strong> Thesis Sentence - Main argument</li>
                          </ul>
                        </div>
                      </>
                    )}

                    {paragraphType.startsWith('body') && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Body Paragraph Structure (4 Sentences)</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>S1:</strong> Topic Sentence - Set the stage</li>
                            <li><strong>S2:</strong> Supporting Details & Quotations</li>
                            <li><strong>S3:</strong> Interpretation - Explain significance</li>
                            <li><strong>S4:</strong> Transition Sentence - Link to next</li>
                          </ul>
                        </div>
                      </>
                    )}

                    {paragraphType === 'conclusion' && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Conclusion Structure (3 Sentences)</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>S1:</strong> Restatement of Thesis</li>
                            <li><strong>S2:</strong> Summary of Main Points</li>
                            <li><strong>S3:</strong> Closing Thought or Reflection</li>
                          </ul>
                        </div>
                      </>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">SVO Pattern</h4>
                      <p className="text-sm text-gray-600">
                        Follow Subject-Verb-Object structure:
                      </p>
                      <ul className="text-xs text-gray-500 mt-1 space-y-1">
                        <li>• Subject: Who/what performs action</li>
                        <li>• Verb: The action</li>
                        <li>• Object: Receives the action</li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Paragraph Checklist</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ {paragraphType === 'introduction' || paragraphType === 'conclusion' ? '3' : '4'} sentences exactly</li>
                        <li>✓ Each sentence has specific purpose</li>
                        <li>✓ Follows SVO pattern</li>
                        <li>✓ Clear transitions</li>
                        <li>✓ Coherent flow</li>
                      </ul>
                    </div>
                  </Card.Content>
                )}
              </Card>
            </div>
          </div>

      </div>
    </div>
  );
}