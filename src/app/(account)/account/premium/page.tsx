'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { 
  PenTool, FileText, Crown, Sparkles
} from 'lucide-react';
import { useGlobalModal } from '@/contexts/GlobalModalContext';

export default function PremiumToolsPage() {
  const { openModal } = useGlobalModal();

  const tools = [
    {
      id: 'five-sentence-essay',
      title: '5/5/5 Essay Builder',
      description: 'Build perfect 5-paragraph essays with exactly 5 sentences each',
      detail: '25 total sentences • Structured format',
      icon: FileText,
      recommended: true
    },
    {
      id: 'paragraph-generator',
      title: 'Single Paragraph Generator',
      description: 'Create well-structured paragraphs with guided templates',
      detail: 'Topic sentences • Evidence • Analysis',
      icon: PenTool,
      recommended: false
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Minimal Style */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Premium Writing Tools</h1>
        <p className="text-sm text-gray-600 mt-1">Professional essay writing assistance</p>
      </div>

      {/* Quick Stats - Minimal Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Tools</p>
              <p className="text-2xl font-semibold text-gray-900">2</p>
            </div>
            <Sparkles className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Plan</p>
              <p className="text-2xl font-semibold text-gray-900">Premium</p>
            </div>
            <Crown className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Tools Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Writing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              onClick={() => openModal(tool.id, tool)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <tool.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-900">
                      {tool.title}
                    </h3>
                    {tool.recommended && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {tool.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tool.detail}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Premium Features</h3>
            <p className="text-sm text-blue-700 mt-1">
              Access to advanced essay building tools with structured templates and guided writing assistance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}