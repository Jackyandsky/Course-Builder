'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, HelpCircle, BookOpen, Users, CreditCard } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQ[] = [
  // Getting Started
  {
    id: '1',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button in the top right corner of any page. You can register with your email address or use social login options. After registration, you\'ll receive a confirmation email to verify your account.',
    category: 'Getting Started'
  },
  {
    id: '2',
    question: 'How do I enroll in a course?',
    answer: 'Browse our course catalog, select a course that interests you, and click "Enroll Now". You can choose from different enrollment options including free courses, premium courses, or course packages.',
    category: 'Getting Started'
  },
  {
    id: '3',
    question: 'What types of courses are available?',
    answer: 'We offer a wide range of courses including Literature, Reading & Writing, Advanced Reading programs, Creative Writing, and specialized courses for different grade levels from elementary through high school.',
    category: 'Getting Started'
  },

  // Course Access
  {
    id: '4',
    question: 'How do I access my enrolled courses?',
    answer: 'Once you\'re logged in, go to your Account dashboard and click on "My Courses". You\'ll see all your enrolled courses with progress indicators and direct access links.',
    category: 'Course Access'
  },
  {
    id: '5',
    question: 'Can I download course materials?',
    answer: 'Yes! Most course materials including PDFs, worksheets, and reading lists are available for download in your course dashboard. Look for the download icon next to each resource.',
    category: 'Course Access'
  },
  {
    id: '6',
    question: 'How long do I have access to a course?',
    answer: 'Course access varies by enrollment type. Most premium courses provide lifetime access, while some specialized programs have specific duration periods. Check your course details for specific access information.',
    category: 'Course Access'
  },

  // Billing & Payments
  {
    id: '7',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.',
    category: 'Billing & Payments'
  },
  {
    id: '8',
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 30-day money-back guarantee for most courses. If you\'re not satisfied with your purchase, contact our support team within 30 days of enrollment for a full refund.',
    category: 'Billing & Payments'
  },
  {
    id: '9',
    question: 'Do you offer discounts or scholarships?',
    answer: 'We regularly offer promotional discounts and have scholarship programs available for qualified students. Check our homepage for current promotions or contact support to inquire about scholarship opportunities.',
    category: 'Billing & Payments'
  },

  // Technical Support
  {
    id: '10',
    question: 'I\'m having trouble logging in. What should I do?',
    answer: 'First, try resetting your password using the "Forgot Password" link on the login page. If you\'re still having issues, clear your browser cache and cookies, or try logging in from an incognito/private browser window. Contact support if problems persist.',
    category: 'Technical Support'
  },
  {
    id: '11',
    question: 'The website is loading slowly. How can I fix this?',
    answer: 'Slow loading can be caused by internet connection issues or browser problems. Try refreshing the page, clearing your browser cache, or switching to a different browser. If the issue persists, it may be temporary server maintenance.',
    category: 'Technical Support'
  },
  {
    id: '12',
    question: 'Can I use the platform on mobile devices?',
    answer: 'Yes! Our platform is fully responsive and works on all devices including smartphones, tablets, and desktop computers. For the best mobile experience, we recommend using the latest version of your browser.',
    category: 'Technical Support'
  },

  // Account Management
  {
    id: '13',
    question: 'How do I update my profile information?',
    answer: 'Log in to your account and go to Account Settings. You can update your personal information, change your password, manage notification preferences, and upload a profile picture.',
    category: 'Account Management'
  },
  {
    id: '14',
    question: 'Can I change my email address?',
    answer: 'Yes, you can change your email address in your Account Settings. You\'ll need to verify the new email address before the change takes effect. Make sure you have access to both your old and new email addresses during this process.',
    category: 'Account Management'
  },
  {
    id: '15',
    question: 'How do I delete my account?',
    answer: 'If you need to delete your account, please contact our support team. We\'ll help you with the account deletion process and inform you about any data retention policies that may apply.',
    category: 'Account Management'
  }
];

const CATEGORIES = [
  { name: 'All', icon: HelpCircle },
  { name: 'Getting Started', icon: BookOpen },
  { name: 'Course Access', icon: Users },
  { name: 'Billing & Payments', icon: CreditCard },
  { name: 'Technical Support', icon: HelpCircle },
  { name: 'Account Management', icon: Users }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = FAQ_DATA;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our platform, courses, and services. 
              Can't find what you're looking for? <Link href="/contact" className="text-blue-600 hover:text-blue-700">Contact our support team</Link>.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.name;
              
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                    ${isSelected 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found for "{searchTerm}"
            </p>
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No questions found</p>
              <p className="text-gray-400">
                Try adjusting your search terms or selecting a different category.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isExpanded = expandedFAQ === faq.id;
              
              return (
                <div 
                  key={faq.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {faq.question}
                        </h3>
                        <p className="text-sm text-gray-500">{faq.category}</p>
                      </div>
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-4">
              Our support team is here to assist you with any questions not covered in our FAQ.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}