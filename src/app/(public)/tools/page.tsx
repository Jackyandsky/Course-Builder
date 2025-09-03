'use client';

import { Card } from '@/components/ui';
import Link from 'next/link';
import { 
  PenTool, Wand2, BookOpen, FileText, 
  Calculator, Languages, Brain, Target,
  ArrowRight
} from 'lucide-react';

const tools = [
  {
    id: 'genParagraph',
    title: 'Paragraph Generator',
    description: 'Build well-structured paragraphs using our guided template system. Perfect for essays and academic writing.',
    icon: PenTool,
    href: '/tools/genParagraph',
    category: 'Writing',
    color: 'blue'
  },
  // Future tools can be added here
  {
    id: 'essayOutline',
    title: 'Essay Outliner',
    description: 'Create comprehensive essay outlines with thesis statements, main points, and supporting evidence.',
    icon: FileText,
    href: '/tools/essayOutline',
    category: 'Writing',
    color: 'green',
    comingSoon: true
  },
  {
    id: 'vocabBuilder',
    title: 'Vocabulary Builder',
    description: 'Expand your vocabulary with contextual learning and practice exercises.',
    icon: Languages,
    href: '/tools/vocabBuilder',
    category: 'Language',
    color: 'purple',
    comingSoon: true
  },
  {
    id: 'citationGen',
    title: 'Citation Generator',
    description: 'Generate properly formatted citations in MLA, APA, Chicago, and other styles.',
    icon: BookOpen,
    href: '/tools/citationGen',
    category: 'Research',
    color: 'orange',
    comingSoon: true
  }
];

const categoryColors: Record<string, string> = {
  Writing: 'bg-blue-100 text-blue-700',
  Language: 'bg-purple-100 text-purple-700',
  Research: 'bg-orange-100 text-orange-700',
  Math: 'bg-green-100 text-green-700'
};

export default function ToolsPage() {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Wand2 className="h-10 w-10 text-blue-600" />
              Learning Tools
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enhance your learning experience with our collection of educational tools designed to help you write better, learn faster, and achieve more.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  tool.comingSoon 
                    ? 'opacity-75 cursor-not-allowed' 
                    : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                }`}
              >
                {tool.comingSoon && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Coming Soon
                    </span>
                  </div>
                )}
                
                <Link 
                  href={tool.comingSoon ? '#' : tool.href}
                  className={tool.comingSoon ? 'pointer-events-none' : ''}
                >
                  <Card.Content className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${tool.color}-100`}>
                        <tool.icon className={`h-6 w-6 text-${tool.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tool.title}
                          </h3>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${categoryColors[tool.category]}`}>
                          {tool.category}
                        </span>
                        <p className="text-sm text-gray-600 mb-4">
                          {tool.description}
                        </p>
                        {!tool.comingSoon && (
                          <div className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <span>Try it now</span>
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Content>
                </Link>
              </Card>
            ))}
          </div>

          {/* Categories Section */}
          {/* <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Explore by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(categoryColors).map(([category, colorClass]) => (
                <Card key={category} className="hover:shadow-md transition-shadow">
                  <Card.Content className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorClass} mb-3`}>
                      {category === 'Writing' && <PenTool className="h-6 w-6" />}
                      {category === 'Language' && <Languages className="h-6 w-6" />}
                      {category === 'Research' && <BookOpen className="h-6 w-6" />}
                      {category === 'Math' && <Calculator className="h-6 w-6" />}
                    </div>
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {tools.filter(t => t.category === category).length} tools
                    </p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div> */}

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Brain className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              More Tools Coming Soon
            </h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              We're constantly developing new tools to support your learning journey. Have a suggestion? Let us know what tools would help you most!
            </p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Suggest a Tool
            </button>
          </div>
      </div>
    </div>
  );
}