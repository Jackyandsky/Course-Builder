// Data structure for organizing 5/5/5 essay examples by book

export interface SentenceExample {
  id: string;
  text: string;
  function: 'hook' | 'lead-in' | 'thesis' | 'elaboration' | 'roadmap' | 
           'topic' | 'evidence' | 'interpretation' | 'transition' | 'implication' |
           'restatement' | 'summary' | 'closing' | 'universality' | 'resonance';
  vocabularyHighlights?: string[]; // Key vocabulary words used
  techniques?: string[]; // Writing techniques demonstrated
  notes?: string; // Additional guidance or explanation
}

export interface ParagraphExample {
  type: 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';
  sentences: {
    sentence1: SentenceExample;
    sentence2: SentenceExample;
    sentence3: SentenceExample;
    sentence4: SentenceExample;
    sentence5: SentenceExample;
  };
  focusPoint?: string; // Main argument or focus of this paragraph
  quotesUsed?: string[]; // Actual quotes from the book if any
}

export interface BookEssayExample {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookGenre?: 'fiction' | 'non-fiction' | 'memoir' | 'biography' | 'classic' | 'contemporary';
  essayTitle?: string;
  thesisStatement: string;
  paragraphs: {
    introduction: ParagraphExample;
    body1: ParagraphExample;
    body2: ParagraphExample;
    body3: ParagraphExample;
    conclusion: ParagraphExample;
  };
  metadata: {
    createdDate?: Date;
    lastModified?: Date;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    wordCount?: number;
    grade?: string;
    tags?: string[];
  };
  draftVersions?: {
    draft1?: ParagraphExample[];
    draft2?: ParagraphExample[];
    refinementNotes?: string[];
  };
}

// Collection structure for multiple books
export interface EssayExampleLibrary {
  examples: BookEssayExample[];
  categories: {
    byGenre: Map<string, BookEssayExample[]>;
    byAuthor: Map<string, BookEssayExample[]>;
    byDifficulty: Map<string, BookEssayExample[]>;
  };
  templates: {
    sentenceStarters: Map<string, string[]>; // Mapped by function type
    transitionPhrases: string[];
    sophisticatedVocabulary: {
      category: string;
      words: string[];
    }[];
  };
}

// Example data for "Between the World and Me"
export const COATES_EXAMPLE: BookEssayExample = {
  id: 'btwm-001',
  bookTitle: 'Between the World and Me',
  bookAuthor: 'Ta-Nehisi Coates',
  bookGenre: 'memoir',
  essayTitle: 'The Essence of Racial Hierarchy in America',
  thesisStatement: 'Coates elicits three agitprop points within his novel: first, the institutionalized racism that effectuates cyclical poverty amongst African-Americans; second, Coates explains how the black body will always be subjugated to discrimination; finally, Coates attempts to explain to his son the double standard that society enforces',
  paragraphs: {
    introduction: {
      type: 'introduction',
      sentences: {
        sentence1: {
          id: 'btwm-intro-1',
          text: 'Between the World and Me talks about the essence of racial hierarchy and white power over American society',
          function: 'hook',
          vocabularyHighlights: ['essence', 'hierarchy'],
          techniques: ['Direct book reference', 'Thematic introduction']
        },
        sentence2: {
          id: 'btwm-intro-2',
          text: 'Throughout the book, Coates makes it clear that the state of any power, especially racial power, is derived from the fact that there are people on the bottom',
          function: 'lead-in',
          vocabularyHighlights: ['derived', 'racial power'],
          techniques: ['Contextual bridge', 'Power dynamics introduction']
        },
        sentence3: {
          id: 'btwm-intro-3',
          text: 'The survival of Whitehood in America has long relied upon the state of being white as a pure and justifiable reason for the Wasps\' preeminence',
          function: 'thesis',
          vocabularyHighlights: ['Whitehood', 'preeminence'],
          techniques: ['Historical context', 'Sociological terminology']
        },
        sentence4: {
          id: 'btwm-intro-4',
          text: 'Coates elicits three agitprop points within his novel:',
          function: 'elaboration',
          vocabularyHighlights: ['elicits', 'agitprop'],
          techniques: ['Transition to roadmap', 'Academic vocabulary']
        },
        sentence5: {
          id: 'btwm-intro-5',
          text: 'first, the institutionalized racism that effectuates cyclical poverty amongst African-Americans; second, Coates explains how the black body will always be subjugated to discrimination; finally, Coates attempts to explain to his son the double standard that society enforces',
          function: 'roadmap',
          vocabularyHighlights: ['institutionalized', 'effectuates', 'cyclical', 'subjugated'],
          techniques: ['Three-part structure', 'Parallel construction', 'Academic vocabulary']
        }
      },
      focusPoint: 'Establishing the three main arguments about racial hierarchy',
      quotesUsed: []
    },
    body1: {
      type: 'body1',
      sentences: {
        sentence1: {
          id: 'btwm-body1-1',
          text: 'The barriers that prevent Black Americans from achieving success is enshrined within the institutions that allow for the perpetuation of racist rhetoric within the justice system and education',
          function: 'topic',
          vocabularyHighlights: ['enshrined', 'perpetuation', 'rhetoric'],
          techniques: ['Topic sentence', 'Institutional critique']
        },
        sentence2: {
          id: 'btwm-body1-2',
          text: 'Coates argues within his novel "that the law has become an excuse for stopping and frisking you"',
          function: 'evidence',
          vocabularyHighlights: [],
          techniques: ['Direct quotation', 'Evidence presentation']
        },
        sentence3: {
          id: 'btwm-body1-3',
          text: 'The notion that their very physiognomy has made them dissidents of the law entrench African-Americans into cyclical poverty',
          function: 'interpretation',
          vocabularyHighlights: ['physiognomy', 'dissidents', 'entrench', 'cyclical'],
          techniques: ['Quote analysis', 'Cause-effect relationship']
        },
        sentence4: {
          id: 'btwm-body1-4',
          text: 'However, the warring debate behind America\'s institution extends further than law, it is the lack of proper education that ultimately binds black America',
          function: 'transition',
          vocabularyHighlights: ['warring', 'extends', 'binds'],
          techniques: ['Transitional phrase', 'Scope expansion']
        },
        sentence5: {
          id: 'btwm-body1-5',
          text: 'Coates said it the best: "the pursuit of knowing [is] freedom," it is only education that can break African Americans out of the chains of colonial tyranny',
          function: 'implication',
          vocabularyHighlights: ['pursuit', 'tyranny'],
          techniques: ['Second quote', 'Deeper significance', 'Solution implication']
        }
      },
      focusPoint: 'Institutional racism in law and education',
      quotesUsed: ['that the law has become an excuse for stopping and frisking you', 'the pursuit of knowing [is] freedom']
    },
    body2: {
      type: 'body2',
      sentences: {
        sentence1: {
          id: 'btwm-body2-1',
          text: 'The American Dream has become a determiner of success, the upshot of which required years of African American enslavement and prejudice',
          function: 'topic',
          vocabularyHighlights: ['determiner', 'upshot', 'enslavement'],
          techniques: ['Topic sentence', 'Historical connection']
        },
        sentence2: {
          id: 'btwm-body2-2',
          text: 'However, Coates talks about something very crucial, and that is, this Dream was built as a product of colonial injustice',
          function: 'evidence',
          vocabularyHighlights: ['crucial', 'colonial'],
          techniques: ['Author reference', 'Core argument']
        },
        sentence3: {
          id: 'btwm-body2-3',
          text: 'It is the undying belief "that their possession of the Dream is the natural result of grit, honour, and good works," and ultimately a denial of their history',
          function: 'interpretation',
          vocabularyHighlights: ['undying', 'possession', 'denial'],
          techniques: ['Quote integration', 'Irony highlight']
        },
        sentence4: {
          id: 'btwm-body2-4',
          text: 'Coates sparks a deeply esoteric discussion, explaining that the black body was the means by which white power was established',
          function: 'transition',
          vocabularyHighlights: ['sparks', 'esoteric', 'established'],
          techniques: ['Transition to deeper analysis']
        },
        sentence5: {
          id: 'btwm-body2-5',
          text: 'Coates explains that it was black skin that sprung industries worth billions and that the power displacement between African Americans and whites will remain',
          function: 'implication',
          vocabularyHighlights: ['sprung', 'displacement'],
          techniques: ['Economic implication', 'Permanence suggestion']
        }
      },
      focusPoint: 'The American Dream built on black oppression',
      quotesUsed: ['that their possession of the Dream is the natural result of grit, honour, and good works']
    },
    body3: {
      type: 'body3',
      sentences: {
        sentence1: {
          id: 'btwm-body3-1',
          text: 'It has become clear in the last decade that the very genealogy that determines your family has become an indicator of your place on the pyramid racial hierarchy',
          function: 'topic',
          vocabularyHighlights: ['genealogy', 'indicator', 'pyramid'],
          techniques: ['Contemporary relevance', 'Metaphor']
        },
        sentence2: {
          id: 'btwm-body3-2',
          text: 'Amongst the diaspora of African American\'s escaping from egregious countries, they are met with the reclamation of white power',
          function: 'evidence',
          vocabularyHighlights: ['diaspora', 'egregious', 'reclamation'],
          techniques: ['Global perspective', 'Pattern identification']
        },
        sentence3: {
          id: 'btwm-body3-3',
          text: 'Just as law has become an excuse for proscribing the black body, it has become an excuse to neglect African Americans\' fundamental rights if they are not \'twice as good\'',
          function: 'interpretation',
          vocabularyHighlights: ['proscribing', 'fundamental', 'neglect'],
          techniques: ['Parallel structure', 'Standard critique']
        },
        sentence4: {
          id: 'btwm-body3-4',
          text: 'Coates tries to make his son realize that there will always be an irreconcilable difference between black America and white America',
          function: 'transition',
          vocabularyHighlights: ['irreconcilable'],
          techniques: ['Personal element', 'Absolutism']
        },
        sentence5: {
          id: 'btwm-body3-5',
          text: 'Instead of telling his son to fight the system he tells him that the only way to beat the system is by being \'twice as good\'',
          function: 'implication',
          vocabularyHighlights: [],
          techniques: ['Pragmatic conclusion', 'Survival strategy']
        }
      },
      focusPoint: 'The double standard and survival strategies',
      quotesUsed: ['twice as good']
    },
    conclusion: {
      type: 'conclusion',
      sentences: {
        sentence1: {
          id: 'btwm-concl-1',
          text: 'Between the World and Me provides a provocative study into the experience of being black in a white world',
          function: 'restatement',
          vocabularyHighlights: ['provocative'],
          techniques: ['Thesis restatement', 'Book evaluation']
        },
        sentence2: {
          id: 'btwm-concl-2',
          text: 'Although often viewed as cynical, Coates words purview the essence of African-American history and institutional profligate',
          function: 'summary',
          vocabularyHighlights: ['cynical', 'purview', 'profligate'],
          techniques: ['Counterargument acknowledgment', 'Summary']
        },
        sentence3: {
          id: 'btwm-concl-3',
          text: 'Coates effectively disabuses any political understanding of racism and presents a deeply intellectual and poignant argument',
          function: 'closing',
          vocabularyHighlights: ['disabuses', 'poignant'],
          techniques: ['Author achievement', 'Impact statement']
        },
        sentence4: {
          id: 'btwm-concl-4',
          text: 'The edict of critics was not wrong, Coates\'s understanding of the double standard within America proves inspiring',
          function: 'universality',
          vocabularyHighlights: ['edict'],
          techniques: ['Critical reception', 'Broader validation']
        },
        sentence5: {
          id: 'btwm-concl-5',
          text: 'The aspirations of colonialism still remain today, as Coates masterfully demonstrates through his letter to his son',
          function: 'resonance',
          vocabularyHighlights: ['aspirations', 'masterfully'],
          techniques: ['Contemporary relevance', 'Format reference', 'Lasting impact']
        }
      },
      focusPoint: 'Overall evaluation and lasting significance',
      quotesUsed: []
    }
  },
  metadata: {
    createdDate: new Date('2024-01-15'),
    lastModified: new Date('2024-01-15'),
    difficulty: 'advanced',
    wordCount: 485,
    grade: 'A',
    tags: ['racial justice', 'memoir', 'social critique', 'American history']
  }
};

// Helper functions for working with examples
export class EssayExampleManager {
  private library: EssayExampleLibrary;

  constructor() {
    this.library = {
      examples: [COATES_EXAMPLE],
      categories: {
        byGenre: new Map(),
        byAuthor: new Map(),
        byDifficulty: new Map()
      },
      templates: {
        sentenceStarters: new Map([
          ['hook', [
            'In [Author]\'s [work], the reader encounters...',
            '[Book Title] explores the fundamental question of...',
            'The essence of [theme] permeates [Author]\'s...'
          ]],
          ['thesis', [
            '[Author] presents three critical arguments:',
            'This work demonstrates that...',
            'Through [literary device], [Author] reveals...'
          ]],
          ['topic', [
            'The first/second/third aspect of [theme] manifests in...',
            '[Author]\'s treatment of [subject] reveals...',
            'Central to understanding [concept] is...'
          ]]
        ]),
        transitionPhrases: [
          'Furthermore', 'Moreover', 'Nevertheless', 'Consequently',
          'In addition', 'However', 'Despite this', 'Therefore'
        ],
        sophisticatedVocabulary: [
          {
            category: 'Analysis',
            words: ['elicits', 'purview', 'disabuses', 'epitomizes', 'illuminates']
          },
          {
            category: 'Social Critique',
            words: ['hegemony', 'oligarchy', 'institutionalized', 'subjugation', 'diaspora']
          },
          {
            category: 'Literary',
            words: ['provocative', 'poignant', 'esoteric', 'dichotomy', 'paradox']
          }
        ]
      }
    };
    this.categorizeExamples();
  }

  private categorizeExamples() {
    this.library.examples.forEach(example => {
      // By genre
      if (example.bookGenre) {
        if (!this.library.categories.byGenre.has(example.bookGenre)) {
          this.library.categories.byGenre.set(example.bookGenre, []);
        }
        this.library.categories.byGenre.get(example.bookGenre)!.push(example);
      }

      // By author
      if (!this.library.categories.byAuthor.has(example.bookAuthor)) {
        this.library.categories.byAuthor.set(example.bookAuthor, []);
      }
      this.library.categories.byAuthor.get(example.bookAuthor)!.push(example);

      // By difficulty
      if (example.metadata.difficulty) {
        if (!this.library.categories.byDifficulty.has(example.metadata.difficulty)) {
          this.library.categories.byDifficulty.set(example.metadata.difficulty, []);
        }
        this.library.categories.byDifficulty.get(example.metadata.difficulty)!.push(example);
      }
    });
  }

  getExampleByBook(bookTitle: string): BookEssayExample | undefined {
    return this.library.examples.find(e => e.bookTitle === bookTitle);
  }

  getExamplesByAuthor(author: string): BookEssayExample[] {
    return this.library.categories.byAuthor.get(author) || [];
  }

  getExamplesByGenre(genre: string): BookEssayExample[] {
    return this.library.categories.byGenre.get(genre) || [];
  }

  getSentencesByFunction(functionType: string): SentenceExample[] {
    const sentences: SentenceExample[] = [];
    this.library.examples.forEach(example => {
      Object.values(example.paragraphs).forEach(paragraph => {
        Object.values(paragraph.sentences).forEach(sentence => {
          if (sentence.function === functionType) {
            sentences.push(sentence);
          }
        });
      });
    });
    return sentences;
  }

  getVocabularyByCategory(category: string): string[] {
    const vocab = this.library.templates.sophisticatedVocabulary.find(v => v.category === category);
    return vocab ? vocab.words : [];
  }

  // Get a specific paragraph example for learning
  getParagraphExample(bookTitle: string, paragraphType: string): ParagraphExample | undefined {
    const example = this.getExampleByBook(bookTitle);
    if (example && paragraphType in example.paragraphs) {
      return example.paragraphs[paragraphType as keyof typeof example.paragraphs];
    }
    return undefined;
  }

  // Generate sentence hints based on function
  getSentenceHint(functionType: string, paragraphType: string): string {
    const starters = this.library.templates.sentenceStarters.get(functionType) || [];
    const examples = this.getSentencesByFunction(functionType);
    
    if (examples.length > 0) {
      const randomExample = examples[Math.floor(Math.random() * examples.length)];
      return randomExample.notes || randomExample.text.substring(0, 50) + '...';
    }
    
    return starters[0] || 'Begin your sentence here...';
  }
}

// Export singleton instance
export const essayExampleManager = new EssayExampleManager();