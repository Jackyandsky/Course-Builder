'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book, GraduationCap, Send, ChevronLeft, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthWrapper from './AuthWrapper';

interface GradeInfo {
  grade: number;
  title: string;
  description: string;
  ageRange: string;
  color: string;
}

const grades: GradeInfo[] = [
  { grade: 1, title: 'Grade 1', description: 'Letter recognition and basic reading', ageRange: '', color: 'bg-gray-300' },
  { grade: 2, title: 'Grade 2', description: 'Simple sentences and comprehension', ageRange: '', color: 'bg-gray-400' },
  { grade: 3, title: 'Grade 3', description: 'Paragraph reading and vocabulary', ageRange: '', color: 'bg-gray-500' },
  { grade: 4, title: 'Grade 4', description: 'Literature analysis and descriptive writing', ageRange: '', color: 'bg-gray-600' },
  { grade: 5, title: 'Grade 5', description: 'Critical reading and essay writing', ageRange: '', color: 'bg-gray-700' },
  { grade: 6, title: 'Grade 6', description: 'Literary analysis and vocabulary', ageRange: '', color: 'bg-gray-800' },
  { grade: 7, title: 'Grade 7', description: 'Advanced comprehension and analysis', ageRange: '', color: 'bg-gray-900' },
  { grade: 8, title: 'Grade 8', description: 'Literary devices and critical thinking', ageRange: '', color: 'bg-slate-700' },
  { grade: 9, title: 'Grade 9', description: 'Complex texts and analytical writing', ageRange: '', color: 'bg-slate-800' },
  { grade: 10, title: 'Grade 10', description: 'Advanced literature and composition', ageRange: '', color: 'bg-slate-900' },
  { grade: 11, title: 'Grade 11', description: 'College prep reading and writing', ageRange: '', color: 'bg-zinc-800' },
  { grade: 12, title: 'Grade 12', description: 'University-level analysis', ageRange: '', color: 'bg-zinc-900' },
];

function DiagnosisPageContent() {
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle grade from URL parameter
  useEffect(() => {
    const gradeParam = searchParams.get('grade');
    if (gradeParam) {
      const gradeNum = parseInt(gradeParam);
      if (gradeNum >= 1 && gradeNum <= 12) {
        setSelectedGrade(gradeNum);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Store test data in sessionStorage for the booking page
    const testData = {
      grade: selectedGrade,
      userEmail: user?.email,
      testDate: data.testDate,
      answers: Object.fromEntries(
        Object.entries(data).filter(([key]) => key.startsWith('q'))
      )
    };
    
    sessionStorage.setItem('diagnosisTestData', JSON.stringify(testData));
    
    // Redirect to booking page
    window.location.href = `/booking/schedule?type=diagnosis&grade=${selectedGrade}`;
  };

  const formatEmailContent = (data: any, grade: number) => {
    let content = `IGPS Diagnostic Test Submission\n\n`;
    content += `Submitted by: ${user?.email}\n`;
    content += `User Profile: ${userProfile?.full_name || user?.email}\n`;
    content += `Grade Level: ${grade}\n`;
    content += `Test Date: ${data.testDate}\n\n`;
    content += `Responses:\n`;
    content += '='.repeat(50) + '\n\n';
    
    // Add all answers
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('q')) {
        const questionNum = key.substring(1);
        content += `Question ${questionNum}: ${value}\n\n`;
      }
    });
    
    return content;
  };

  if (selectedGrade) {
    return <TestForm 
      grade={selectedGrade} 
      onBack={() => setSelectedGrade(null)} 
      onSubmit={handleSubmit} 
      isSubmitting={isSubmitting} 
      showSuccess={showSuccess}
      userEmail={user?.email || ''}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Select Grade Level</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the appropriate grade level to begin the diagnostic assessment. Each test is carefully designed to evaluate reading comprehension, writing skills, and grade-appropriate literacy abilities.
          </p>
        </div>

        {/* Grade Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {grades.map((grade) => (
            <button
              key={grade.grade}
              onClick={() => setSelectedGrade(grade.grade)}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`${grade.color} p-6 text-white min-h-[140px] flex flex-col justify-center`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">{grade.title}</h3>
                  <p className="text-sm leading-relaxed opacity-90">{grade.description}</p>
                </div>
              </div>
              <div className="bg-white p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Start Assessment</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">About the Assessment</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-600 mb-2">What to Expect</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>Grade-appropriate reading passages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>Comprehension questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>Writing exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>Vocabulary assessment</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-600 mb-2">Test Duration</h4>
              <p className="text-sm text-gray-600 mb-3">
                Each assessment typically takes 30-45 minutes to complete, depending on the grade level and student pace.
              </p>
              <h4 className="font-medium text-gray-600 mb-2">Results</h4>
              <p className="text-sm text-gray-600">
                Test results will be sent to the provided email address for review by our education specialists.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Test Form Component
function TestForm({ grade, onBack, onSubmit, isSubmitting, showSuccess, userEmail }: any) {
  const gradeInfo = grades.find(g => g.grade === grade)!;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Grade Selection</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`${gradeInfo.color} text-white rounded-t-2xl p-6 print:bg-gray-800`}>
          <h2 className="text-2xl font-bold">{gradeInfo.title} Diagnostic Test</h2>
          <p className="mt-2 opacity-90">{gradeInfo.description}</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-b-2xl shadow-lg p-8">
          {/* Hidden fields for submission data */}
          <input type="hidden" name="studentName" value={userEmail} />
          <input type="hidden" name="parentEmail" value={userEmail} />
          <input type="hidden" name="testDate" value={new Date().toISOString().split('T')[0]} />
          
          {/* Test Questions */}
          <div className="space-y-8">
            {/* Sample questions based on grade */}
            {(() => {
              let questionNumber = 0;
              return getSampleQuestions(grade).map((question, index) => {
                if (question.type !== 'reading') {
                  questionNumber++;
                }
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      {question.type !== 'reading' && (
                        <span className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {questionNumber}
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{question.text}</p>
                        {question.passage && (
                          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-gray-600 italic whitespace-pre-line">{question.passage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                
                {question.type === 'reading' && (
                  <div className="ml-11">
                    {/* Reading passages are display only */}
                  </div>
                )}
                
                {question.type === 'multiple-choice' && (
                  <div className="ml-11 space-y-2">
                    {question.options?.map((option: any, optIndex: number) => (
                      <label key={optIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name={`q${index + 1}`}
                          value={option}
                          required
                          className="text-gray-600 focus:ring-gray-500"
                        />
                        <span className="text-gray-600">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'multiple-choice-group' && (
                  <div className="ml-11 space-y-4">
                    {question.subQuestions?.map((subQ: any, subIndex: number) => (
                      <div key={subIndex} className="space-y-2">
                        {subQ.word && <p className="font-medium text-gray-700">{subQ.word}</p>}
                        {subQ.text && <p className="text-gray-700">{subQ.text}</p>}
                        <div className="space-y-2">
                          {subQ.options?.map((option: any, optIndex: number) => (
                            <label key={optIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                              <input
                                type="radio"
                                name={`q${index + 1}_${subIndex}`}
                                value={option}
                                required
                                className="text-gray-600 focus:ring-gray-500"
                              />
                              <span className="text-gray-600">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === 'short-answer' && (
                  <div className="ml-11">
                    <input
                      type="text"
                      name={`q${index + 1}`}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Type your answer here..."
                    />
                  </div>
                )}
                
                {question.type === 'essay' && (
                  <div className="ml-11">
                    <textarea
                      name={`q${index + 1}`}
                      required
                      rows={question.rows || 4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-y"
                      placeholder="Write your answer here..."
                    />
                  </div>
                )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex items-center justify-end print:hidden">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              <Send className="h-5 w-5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Test'}</span>
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 print:hidden">
              <p className="font-medium">Test submitted successfully!</p>
              <p className="text-sm mt-1">The results have been sent to the email provided.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Sample questions for different grades
function getSampleQuestions(grade: number) {
  // Grade-specific diagnostic questions
  const gradeQuestions: { [key: number]: any[] } = {
    1: [
      {
        text: "Read the following passage:",
        passage: "I like to play with my friends. They make me happy because they are nice and very funny. Friends are important because they can make you very happy. I try to be a good friend too. I know how to be a good friend because I know how to help other people and be nice to them.",
        type: "reading"
      },
      {
        text: "What does it mean to you?",
        type: "essay",
        rows: 4
      },
      {
        text: "Pick the right spelling of the word:",
        type: "multiple-choice-group",
        subQuestions: [
          {
            options: ["I'm hunry", "I'm hungry", "Iam hungri", "I'm Hungriy"],
            correctAnswer: 1
          },
          {
            options: ["Tom's qwuik", "Toms quick", "Tom's quick", "Toms qwuick"],
            correctAnswer: 2
          },
          {
            options: ["The phone's usefull", "The phones useful", "The phone's useful", "The fone's useful"],
            correctAnswer: 2
          }
        ]
      },
      {
        text: "What do the following words mean:",
        type: "multiple-choice-group",
        subQuestions: [
          {
            word: "HURRY",
            options: ["Walk", "Skip", "Rush", "Hop"],
            correctAnswer: 2
          },
          {
            word: "HOP",
            options: ["Run", "Jump", "Fall", "Swim"],
            correctAnswer: 1
          }
        ]
      },
      {
        text: "Writing: Who is your best friend? Why? Tell us about your best friend.",
        type: "essay",
        rows: 6
      }
    ],
    2: [
      {
        text: "Reading Passage",
        passage: "Emma got a new lunch box which everyone loved. One day she noticed a scratch on it. She was very unhappy. She wanted to buy a new one so she counted the coins in her piggy bank. \"I only have fifty cents. Ten dollars will take forever.\" She tried to think of other ways to get a new lunch box but nothing came to mind. The next day at school, Emma's teacher, Mrs. Robinson, gave the class a pop quiz. Emma aced the quiz. Mrs. Robinson gave Emma a smiley face sticker. But Emma didn't put it on her paper. She had an idea. She put the sticker on her lunch box.\n\nAs the days went by, Emma got more and more stickers from her teacher for good work. Each time, Emma put the sticker on her lunch box. Soon, Emma's lunch box was covered with smiley face stickers. Even the scratch was covered up.\n\n\"Those smiley faces make me happy,\" Alice told Emma one day at lunch. \"You have a happy lunch box.\"\n\nEmma smiled. She loved her lunch box.",
        type: "reading"
      },
      {
        text: "What was Emma's idea in the passage above?",
        type: "short-answer"
      },
      {
        text: "How would you explain the passage?",
        type: "short-answer"
      },
      {
        text: "If you were Emma's friend, how would you help her with her \"lunch box\" problem?",
        type: "short-answer"
      },
      {
        text: "What is another way of saying happy?",
        type: "multiple-choice",
        options: ["Content", "Quick", "Cross", "Kind"]
      },
      {
        text: "Writing Section: 1. What is the meaning of: \"dogs are man's best friends?\" Do you like dogs or pets in general? Why?",
        type: "essay",
        rows: 5
      },
      {
        text: "2. Who is your best friend and what makes them your best friend?",
        type: "essay",
        rows: 5
      },
      {
        text: "3. What does it mean to be kind?",
        type: "essay",
        rows: 5
      }
    ],
    3: [
      {
        text: "Reading Passage",
        passage: "When it snows, Kate and Blaine are the happiest. They both like to ski and their parents drive them to the mountains every weekend. Kate is younger than Blaine and she started skiing two years after him. She liked it so much that she kept practicing till she felt really comfortable and stable on her skis. She practiced so much that she even surpassed her brother. Blaine, instead of getting jealous, asked her to show him how she got so good so fast. Kate showed him the few tricks she had learned from the many days of practicing on the slopes. Soon enough, Blaine got as good as Kate.",
        type: "reading"
      },
      {
        text: "What is the passage about?",
        type: "short-answer"
      },
      {
        text: "Are you more like Kate or Blaine? Why?",
        type: "short-answer"
      },
      {
        text: "What is the meaning of the word \"surpassed\" as used in the passage?",
        type: "short-answer"
      },
      {
        text: "What is the meaning of the word \"jealous\" as used in the passage?",
        type: "short-answer"
      },
      {
        text: "Writing Section: 1. Describe your best vacation in 3 sentences.\na. Why was it so great?\nb. What made it so special?",
        type: "essay",
        rows: 5
      },
      {
        text: "2. Do books matter?\na. Why/why not?\nb. Why should we read?",
        type: "essay",
        rows: 5
      },
      {
        text: "3. Should children younger than 10 years old have a cell phone?\na. Why/why not?",
        type: "essay",
        rows: 5
      }
    ],
    4: [
      {
        text: "Read the following passage from Christopher Paul Curtis' book Bud, Not Buddy. How is the main character, Bud, describing the library? Explain in just two sentences.",
        passage: "As soon as I got into the library I closed my eyes and took a deep breath. I got a whiff of the leather on all the old books, a smell that got real strong if you picked one of them up and stuck your nose real close to it when you turned the pages. Then there was the smell of the cloth that covered the brand-new books, books that made a splitting sound when you opened them. Then I could sniff the paper, that soft, powdery, drowsy smell that comes off the page in little puffs when you're reading something or looking at some pictures, kind of hypnotizing smell.",
        type: "short-answer"
      },
      {
        text: "How many verbs are in the following passage? Underline them. How many adjectives? Underline them.",
        passage: "If you didn't have a real good imagination you'd probably think those noises were the sounds of some kid blowing a horn for the first time, but I knew better than that. I could tell those were the squeaks and squawks of one door closing and another one opening.",
        type: "short-answer"
      },
      {
        text: "What kind of a character is Matilda based on the description below from Roald Dahl's Matilda?",
        passage: "The books transported her into new worlds and introduced her to amazing people who lived exciting lives. She went on olden-day sailing ships with Joseph Conrad. She went to Africa with Ernest Hemingway and to India with Rudyard Kipling. She travelled all over the world while sitting in her little room in an English village.",
        type: "short-answer"
      },
      {
        text: "Summarize the above paragraph (Question 3) in one sentence.",
        type: "short-answer"
      },
      {
        text: "Writing Section: Describe the perfect Sunday.\n1. What would you do?\n2. What would it look like?\n3. Write five sentences.",
        type: "essay",
        rows: 8
      }
    ],
    5: [
      {
        text: "Read the following passage from Roald Dahl's book Matilda. Paraphrase, in your words, what the main idea of the passage is. Write 4 sentences in your summary.",
        passage: "From then on, Matilda would visit the library only once a week in order to take out new books and return the old ones. Her own small bedroom now became her reading-room and there she would sit and read most afternoons, often with a mug of hot chocolate beside her. She was not quite tall enough to reach things around in the kitchen, but she kept a small box in the outhouse which she brought in and stood on in order to get whatever she wanted. Mostly it was hot chocolate she made, warming the milk in a saucepan on the stove before mixing it. Occasionally she made Bovril or Ovaltine. It was pleasant to take a hot drink up to her room and have it beside her as she sat in her silent room reading in the empty house in the afternoons. The books transported her into new worlds and introduced her to amazing people who lived exciting lives. She went to Africa with Ernest Hemingway and to India with Rudyard Kipling. She traveled all over the world while sitting in her little room in an English village.",
        type: "essay",
        rows: 6
      },
      {
        text: "Read the following passage. Underline the Nouns and Prepositions in it. Summarize what it says in ONE sentence.",
        passage: "It's strange indeed how memories can lie dormant in a man's mind for so many years. Yet those memories can be awakened and brought forth fresh and new, just by something you've seen, or something you've heard, or the sight of an old familiar face.",
        type: "short-answer"
      },
      {
        text: "What do the following words mean: Provide a simple definition or use the word in a sentence.\n1. Awaken\n2. Occasionally\n3. Presuppose",
        type: "essay",
        rows: 5
      },
      {
        text: "Read the following passage from Grace Lin's Where the Mountain Meets the Moon. What is the main point? Summarize it in three sentences. Underline all the verbs.",
        passage: "'Do you remember the story I told you about the paper of happiness? And the secret, which was one word written over and over again? … I have thought a long time about what that word could have been,' Ba said. 'Was it wisdom or honor? Love or truth? For a long time I liked to think that the word was kindness.'\nMa's face remained hidden in Minli's bed, but her sobs had stopped and Ba knew she was listening.\n'But now,' Ba said, 'I think, perhaps, the word was faith.'",
        type: "essay",
        rows: 5
      },
      {
        text: "Writing Section: What does it mean to pursue happiness?\nExplore this topic in seven sentences.",
        type: "essay",
        rows: 8
      }
    ],
    6: [
      {
        text: "I. Reading Comprehension (10 minutes)\nRead the following passage. Afterwards, summarize what it says in just one full sentence.",
        passage: "After this stop, we made on to the southward continually for ten or twelve days, living very sparingly on our provisions, which began to abate very much, and going no oftener to the shore than we were obliged to for fresh water. My design in this was to make the river Gambia or Senegal, that is to say anywhere about the Cape de Verde, where I was in hopes to meet with some European ship; and if I did not, I knew not what course I had to take, but to seek for the islands, or perish there among the negroes. I knew that all the ships from Europe, which sailed either to the coast of Guinea or to Brazil, or to the East Indies, made this cape, or those islands; and, in a word, I put the whole of my fortune upon this single point, either that I must meet with some ship or must perish.",
        type: "short-answer"
      },
      {
        text: "II. Read the following passage (20 minutes)\nSummarize the paragraphs in three sentences: one per paragraph",
        passage: "As soon as he heard the other members of the family stirring he retired to his den, and I breathed freer. But in the afternoon, while Joseph and Hareton were at their work, he came into the kitchen again, and, with a wild look, bid me come and sit in the house: he wanted somebody with him. I declined; telling him plainly that his strange talk and manner frightened me, and I had neither the nerve nor the will to be his companion alone.\n\n'I believe you think me a fiend,' he said, with his dismal laugh: 'something too horrible to live under a decent roof.' Then turning to Catherine, who was there, and who drew behind me at his approach, he added, half sneeringly,—'Will you come, chuck? I'll not hurt you. No! to you I've made myself worse than the devil. Well, there is one who won't shrink from my company! By God! she's relentless.'\n\nI felt stunned by the awful event; and my memory unavoidably recurred to former times with a sort of oppressive sadness. But poor Hareton, the most wronged, was the only one who really suffered much. He sat by the corpse all night, weeping in bitter earnest. He pressed its hand, and kissed the sarcastic, savage face that every one else shrank from contemplating; and bemoaned him with that strong grief which springs naturally from a generous heart, though it be tough as tempered steel.",
        type: "essay",
        rows: 5
      },
      {
        text: "III. Vocabulary in Context\nWhat is the meaning of these words as they are used in these paragraphs?\n1. Retired\n2. Sneeringly\n3. Unavoidably\n4. Stunned\n5. Sarcastic\n6. Oppressive\n7. Bemoan",
        type: "essay",
        rows: 8
      },
      {
        text: "IV. Writing (20 minutes)\nWrite two paragraphs on the following topic: \"What does it mean to have a meaningful life?\"",
        type: "essay",
        rows: 10
      }
    ],
    7: [
      {
        text: "Read the following passage from Harper Lee's book To Kill a Mockingbird. Paraphrase, in your words, what the main idea of the passage is. Write 2 sentences in your summary. Do you agree with the idea therein?",
        passage: "You never really understand a person until you consider things from his point of view... Until you climb inside of his skin and walk around in it.",
        type: "essay",
        rows: 5
      },
      {
        text: "Read the following passage. Underline the Verbs in it. What is the main concept it discusses? Analyze what it says in Four sentences.",
        passage: "Atticus said to Jem one day, \"I'd rather you shot at tin cans in the backyard, but I know you'll go after birds. Shoot all the blue jays you want, if you can hit 'em, but remember it's a sin to kill a mockingbird.\" That was the only time I ever heard Atticus say it was a sin to do something, and I asked Miss Maudie about it. \"Your father's right,\" she said. \"Mockingbirds don't do one thing except make music for us to enjoy. They don't eat up people's gardens, don't nest in corn cribs, they don't do one thing but sing their hearts out for us. That's why it's a sin to kill a mockingbird.\"",
        type: "essay",
        rows: 6
      },
      {
        text: "Read the following passage carefully from Daniel Defoe's Robinson Crusoe. Afterwards, summarize it in Two sentences. Underline the adjectives in the passage.",
        passage: "I have since often observed, how incongruous and irrational the common temper of mankind is, especially of youth ... that they are not ashamed to sin, and yet are ashamed to repent; not ashamed of the action for which they ought justly to be esteemed fools, but are ashamed of the returning, which only can make them be esteemed wise men.",
        type: "essay",
        rows: 5
      },
      {
        text: "What do the following words mean? You may also use them in a sentence to show what they mean.\n1. Incongruous\n2. Irrational",
        type: "essay",
        rows: 4
      },
      {
        text: "Writing Section: Write an analysis of the following passage. What is the main point and what does it mean to you\nExplore this passage in 10 sentences.\n\n\"It put me upon reflecting how little repining there would be among mankind at any condition of life, if people would rather compare their condition with those that were worse, in order to be thankful, than be always comparing them with those which are better, to assist their murmurings and complaining.\"",
        type: "essay",
        rows: 12
      }
    ],
    8: [
      {
        text: "I. Reading and Summarizing (10 points) [10 minutes]\nRead the following passage and summarize it in one sentence.",
        passage: "Until the 19th century, no one had the slightest idea that dinosaurs once lived on earth. The first remains of such an animal were unearthed in a quarry in Oxfordshire, England, in 1822. The creature to which the remains belonged was named Megalosaurus, which means \"big lizard.\" (The word \"dinosaur\" means \"terrible lizard.\") Since then, over 800 fossils of the long-extinct dinosaurs have been discovered and studied. We now know that although some of the dinosaurs were fierce hunters, there were many others which were harmless plant-eaters.",
        type: "short-answer"
      },
      {
        text: "II. Pick the right answer (5 points) [5 minutes]",
        type: "multiple-choice-group",
        subQuestions: [
          {
            text: "1. What example of a literary device is this: Her daughter was like the sun in her life.",
            options: ["Metaphor", "Personification", "Simile", "Alliteration"],
            correctAnswer: 2
          },
          {
            text: "2. She sells seashells by the sea-shore.",
            options: ["Metaphor", "Alliteration", "Personification", "Simile"],
            correctAnswer: 1
          },
          {
            text: "3. The sun smiled at the little girl with the balloon.",
            options: ["Personification", "Metaphor", "Alliteration", "Simile"],
            correctAnswer: 0
          },
          {
            text: "4. Painting was her paradise.",
            options: ["Personification", "Metaphor", "Alliteration", "Simile"],
            correctAnswer: 1
          },
          {
            text: "5. The poet depicted a sublime story. Sublime is:",
            options: ["Epithet", "Metaphor", "Simile", "Personification"],
            correctAnswer: 0
          }
        ]
      },
      {
        text: "III. Reading Comprehension and Analysis (30 points) [20 minutes]\nRead the following story carefully (Puppy Love). In your own words, paraphrase what it says in ONE paragraph (no more than 4 sentences).\n[Note: Full story to be provided in actual test]",
        type: "essay",
        rows: 6
      },
      {
        text: "Pick the right answer: (10 points) [10 minutes]\n1. What does the word progressive mean as it is used in the story?",
        type: "multiple-choice",
        options: ["Modern", "Complete", "Increasing", "Encouraging"]
      },
      {
        text: "2. The two themes most strongly associated with this story would be:",
        type: "multiple-choice",
        options: ["loyalty and friendship", "loss and loneliness", "bravery and loss", "friendship and ownership"]
      },
      {
        text: "Select one of the following: (40 points) [10 minutes]\nChoose ONE of the following topics and write one paragraph:\nI. In one paragraph, describe your favourite activity.\nII. In one paragraph describe your best friend.\nIII. In one paragraph, describe your favourite movie.",
        type: "essay",
        rows: 8
      },
      {
        text: "What do these words mean: (5 points) [5 minutes]",
        type: "multiple-choice-group",
        subQuestions: [
          {
            text: "Puerile:",
            options: ["Smart", "Able", "Childish", "Mature"],
            correctAnswer: 2
          },
          {
            text: "Belligerent:",
            options: ["Kind", "Aggressive", "Insightful", "Hasty"],
            correctAnswer: 1
          }
        ]
      }
    ],
    9: [
      {
        text: "I. Reading and Writing\nRead the following passage and summarize it in one sentence.",
        passage: "George's voice became deeper. He repeated his words rhythmically as though he had said them many times before. 'Guys like us, that work on ranches, are the loneliest guys in the world. They got no family. They don't belong no place. They come to a ranch an' work up a stake, and the first thing you know they're poundin' their tail on some other ranch. They ain't got nothing to look ahead to.",
        type: "short-answer"
      },
      {
        text: "II.\nRead the following quotation from John Steinbeck's Of Mice and Men. What does it mean to you? What are two interpretations you could provide to shed light on it?\n\n\"Guys like us got nothing to look ahead to.\"",
        type: "essay",
        rows: 5
      },
      {
        text: "III.\nThe following comes from Homer's Odyssey. How do you understand it? Do you agree/disagree with its general sentiment? Answer these questions in the form of a paragraph.\n\n\"A man who has been through bitter experiences and travelled far enjoys even his sufferings after a time\"",
        type: "essay",
        rows: 6
      },
      {
        text: "IV.\nRead the following from the Odyssey and interpret it in one paragraph. Underline all the definite articles in the quotation.",
        passage: "These nights are endless, and a man can sleep through them,\nor he can enjoy listening to stories, and you have no need\nto go to bed before it is time. Too much sleep is only\na bore. And of the others, any one whose heart and spirit\nurge him can go outside and sleep, and then, when the dawn shows,\nbreakfast first, then go out to tend the swine of our master.\nBut we two, sitting here in the shelter, eating and drinking,\nshall entertain each other remembering and retelling\nour sad sorrows. For afterwards a man who has suffered\nmuch and wandered much has pleasure out of his sorrows.",
        type: "essay",
        rows: 6
      },
      {
        text: "V. Vocabulary\nWhat do the following words mean? You may either provide definitions for them or you could use them in a sentence.\n1. Majestic\n2. Preponderance\n3. Soporific\n4. Mellifluous\n5. Imperious",
        type: "essay",
        rows: 8
      },
      {
        text: "VI. Writing\nAnalyze the following from George Orwell's Animal Farm:\n\n\"Man is the only creature that consumes without producing. He does not give milk, he does not lay eggs, he is too weak to pull the plough, he cannot run fast enough to catch rabbits. Yet he is lord of all the animals. He sets them to work, he gives back to them the bare minimum that will prevent them from starving, and the rest he keeps for himself.\"\n\nRequirements:\n1. Two paragraphs.\n2. Five sentences per paragraph.",
        type: "essay",
        rows: 12
      }
    ],
    10: [
      {
        text: "Part I - Reading (25 minutes)\nRead the following passage from Richard Russo's novel Straight Man. Answer the following six questions.",
        passage: "Truth be told I'm not an easy man. I can be an entertaining one thought it's been my experience most people don't want to be entertained. They want to be comforted. And, of course, my idea of entertaining might not be yours. I'm in complete agreement with all those people who say about movies, \"I just want to be entertained.\" This populist position is much derided by my academic colleagues as simpleminded and unsophisticated, evidence of questionable analytical and critical acuity. But I agree with the premise, and I too just want to be entertained. That I am almost never entertained by what entertains other people who just want to be entertained doesn't make us philosophically incompatible. It just means we shouldn't go to the movies together.",
        type: "reading"
      },
      {
        text: "1. In one sentence, what is the premise of the paragraph? Use only one verb in your summarizing sentence.",
        type: "short-answer"
      },
      {
        text: "2. In this context, \"entertaining\" means:",
        type: "multiple-choice",
        options: ["Diverting", "Amusing", "Having", "Enjoying"]
      },
      {
        text: "3. What are four other words you could use to mean 'comforted'?",
        type: "short-answer"
      },
      {
        text: "4. Paraphrase the following sentence, as featured in the passage above, using entirely different words but maintaining its original meaning: \"This populist position is much derided by my academic colleagues as simpleminded and unsophisticated, evidence of questionable analytical and critical acuity.\"",
        type: "essay",
        rows: 3
      },
      {
        text: "5. Populist, as used in the passage, means:",
        type: "multiple-choice",
        options: ["Popular", "Ordinary", "Elitist", "Patriotic"]
      },
      {
        text: "6. Please provide three other ways of saying 'derided.'",
        type: "short-answer"
      },
      {
        text: "Part II - Writing (25 minutes)\nTopic: \"A Life of Meaning Requires a Life of Focus.\"\n\nExplore this idea in just two full paragraphs.\nWhat are your thoughts about the topic? Do you agree or disagree with it? Why/why not? Be as specific and focused on the topic as you can. The paragraphs cannot exceed ten sentences.",
        type: "essay",
        rows: 12
      }
    ],
    11: [
      {
        text: "Question 1\nRead the following passage from F. Scott Fitzgerald's The Great Gatsby.\n1. Underline all the adverbs.\n2. What is the meaning of the noun phrase: \"irresistible prejudice.\"\n3. Explain in 3 sentences what it means.",
        passage: "He smiled understandingly-much more than understandingly. It was one of those rare smiles with a quality of eternal reassurance in it, that you may come across four or five times in life. It faced--or seemed to face--the whole eternal world for an instant, and then concentrated on you with an irresistible prejudice in your favor. It understood you just as far as you wanted to be understood, believed in you as you would like to believe in yourself, and assured you that it had precisely the impression of you that, at your best, you hoped to convey.",
        type: "essay",
        rows: 6
      },
      {
        text: "Question 2\nThe following passage comes from Truman Capote's In Cold Blood.\n1. Explore what it means in one full paragraph.\n2. Underline the indefinite articles.",
        passage: "Once a thing is set to happen, all you can do is hope it won't. Or will-depending. As long as you live, there's always something waiting, and even if it's bad, and you know it's bad, what can you do? You can't stop living.",
        type: "essay",
        rows: 6
      },
      {
        text: "Question 3\nWhat is the mood this passage from The Adventures of Huckleberry Finn captures?\n1. Explore what Mark Twain is trying to convey in one paragraph.",
        passage: "It's lovely to live on a raft. We had the sky, up there, all speckled with stars, and we used to lay on our backs and look up at them, and discuss about whether they was made, or only just happened- Jim he allowed they was made, but I allowed they happened; I judged it would have took too long to make so many.",
        type: "essay",
        rows: 6
      },
      {
        text: "Question 4\nThe following comes from Arthur Miller's The Crucible. What does it mean?\n1. How would you interpret it in one paragraph?",
        passage: "Because it is my name! Because I cannot have another in my life! Because I lie and sign myself to lies! Because I am not worth the dust on the feet of them that hang! How may I live without my name? I have given you my soul; leave me my name!",
        type: "essay",
        rows: 6
      },
      {
        text: "Writing Section\nTopic: \"What does it mean to live a life of meaning?\"\n1. Explore this topic in two paragraphs.",
        type: "essay",
        rows: 10
      }
    ],
    12: [
      {
        text: "1. Shakespeare's Hamlet\nRead the following from Shakespeare's Hamlet. After you're done reading it, pick one of the following to determine what it is:",
        passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heart-ache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep: perchance to dream: ay, there's the rub;\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil,\nMust give us pause: there's the respect\nThat makes calamity of so long life;\nFor who would bear the whips and scorns of time,\nThe oppressor's wrong, the proud man's contumely,\nThe pangs of despised love, the law's delay,\nThe insolence of office and the spurns\nThat patient merit of the unworthy takes,\nWhen he himself might his quietus make\nWith a bare bodkin? who would fardels bear,\nTo grunt and sweat under a weary life,\nBut that the dread of something after death,\nThe undiscover'd country from whose bourn\nNo traveller returns, puzzles the will\nAnd makes us rather bear those ills we have\nThan fly to others that we know not of?\nThus conscience does make cowards of us all;",
        type: "multiple-choice",
        options: ["Dialog", "Monologue", "Repartee", "Soliloquy"]
      },
      {
        text: "2. In one sentence, clarify what this line may refer to: \"The undiscover'd country from whose bourn/No traveller returns…\"",
        type: "short-answer"
      },
      {
        text: "3. What might Hamlet mean when he notes: \"To sleep: perchance to dream: ay, there's the rub;/For in that sleep of death what dreams may come\"",
        type: "essay",
        rows: 4
      },
      {
        text: "4. This iconic Shakespearean line is often referred to as:",
        type: "multiple-choice",
        options: ["A rhetorical question", "An existential question", "A moral question", "An ambiguous question"]
      },
      {
        text: "5. In one paragraph please detail a short analysis of the \"To Be or Not to Be\" passage. Identify the main idea and analyze its potential meaning.",
        type: "essay",
        rows: 6
      },
      {
        text: "6. The following passage is from Ernest Hemingway's The Old Man and the Sea.",
        passage: "In the dark the old man could feel the morning coming and as he rowed he heard the trembling sound as flying fish left the water and the hissing that their stiff set wings made as they soared away in the darkness. He was very fond of flying fish as they were his principal friends in the ocean. He was sorry for the birds, especially the small delicate dark terns that were always flying and looking and almost never finding, and he thought, \"The birds have a harder life than we do except for the robber birds and the heavy strong ones. Why did they make birds so delicate and fine as those sea swallows when the ocean can be so cruel? She is kind and very beautiful. But she can be so cruel and it comes so suddenly and such birds that fly, dipping and hunting, with their small sad voices are made too delicately for the sea.\"",
        type: "reading"
      },
      {
        text: "Paraphrase the premise of the paragraph in one sentence consisting of no more than 2 verbs.",
        type: "short-answer"
      },
      {
        text: "7. \"kind\", \"beautiful\", and \"strong\" are used as what kind of a literary device?",
        type: "multiple-choice",
        options: ["Metaphor", "Simile", "Epithet", "Personification"]
      },
      {
        text: "8. Please list 4 other nouns meaning 'friend'",
        type: "short-answer"
      },
      {
        text: "9. The following passages are from Jonathan Franzen's The Corrections.",
        passage: "The Madness of an autumn prairie cold front coming through. You could feel it: something terrible was going to happen. The sun low in the sky, a minor light, a cooling star. Gust after gust of disorder. Trees restless, temperatures falling, the whole northern religion of things coming to an end. No children in the yards here. Shadows lengthened on yellowing zoysia. Red oaks and pin oaks and swamp white oaks rained acorns on houses with no mortgage. Storm windows shuddered in the empty bedrooms. And the drone and hiccup of a clothes dryer, the nasal contention of a leaf blower, the ripening of local apples in a paper bag, the smell of the gasoline with which Alfred Lambert had cleaned the paintbrush from his morning painting of the wicker love seat.\n\n…\n\nEnid felt sure that her own head would clear if only she didn't have to wonder, every five minutes, what Alfred was up to. But, try as she might, she couldn't get him interested in life. When she encouraged him to take up his metallurgy again, he looked at her as if she'd lost her mind. When she asked whether there wasn't some yard work he could do, he said his legs hurt.",
        type: "reading"
      },
      {
        text: "Summarize the two paragraphs in one sentence.",
        type: "short-answer"
      },
      {
        text: "10. Paraphrase the following sentences by using entirely different words while maintaining its original meaning:\n\na. \"You could feel it: something terrible was going to happen.\"\nb. \"Enid felt sure that her own head would clear if only she didn't have to wonder, every five minutes, what Alfred was up to.\"\nc. \"But, try as she might, she couldn't get him interested in life.\"",
        type: "essay",
        rows: 8
      }
    ]
  };

  // Return grade-specific questions or default to grade 1 if not found
  return gradeQuestions[grade] || gradeQuestions[1];
}

// Export with authentication wrapper
export default function DiagnosisPage() {
  return (
    <AuthWrapper>
      <DiagnosisPageContent />
    </AuthWrapper>
  );
}