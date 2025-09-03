'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, Star, BookOpen, Users, Clock, Target, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const LEARNING_LEVELS = [
  {
    id: 'basic',
    name: 'Basic Level',
    description: 'Foundation curriculum with core materials',
    features: [
      'Access to core curriculum',
      'Essential reading materials',
      'Email support',
      'Standard learning pace',
      'Progress tracking',
      'Community access'
    ],
    icon: '🟢',
    popularity: 'Perfect for beginners',
    color: 'green'
  },
  {
    id: 'standard', 
    name: 'Standard Level',
    description: 'Comprehensive curriculum with extended resources',
    features: [
      'Full curriculum access',
      'Extended materials library',
      'Priority email support',
      'Flexible pacing options',
      'Advanced progress tracking',
      'Discussion forums',
      'Study guides & supplements'
    ],
    icon: '🟡',
    popularity: 'Most popular choice',
    color: 'yellow'
  },
  {
    id: 'premium',
    name: 'Premium Level', 
    description: 'Complete curriculum with personalized guidance',
    features: [
      'Complete curriculum + advanced materials',
      'One-on-one guidance sessions',
      'Custom learning path design',
      'Priority support (24hr response)',
      'Advanced analytics & insights',
      'Exclusive resources & tools',
      'Direct instructor access',
      'Personalized feedback'
    ],
    icon: '🟟',
    popularity: 'For serious learners',
    color: 'purple'
  }
];

export default function EnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  
  // Get courseId from URL params
  const courseId = searchParams.get('courseId') || '';

  const handleContinue = () => {
    if (selectedLevel) {
      // Pass both level and courseId to commitment page
      const params = new URLSearchParams();
      params.append('level', selectedLevel);
      if (courseId) params.append('courseId', courseId);
      
      router.push(`/enroll/commitment?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--igps-landing-background)]" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
      <div className="max-w-[1200px] mx-auto px-[20px] py-[80px]">
        <div className="text-center mb-[60px]">
          <h1 className="text-[48px] font-bold mb-[18px] text-[var(--igps-landing-text-color)] tracking-[-0.022em] leading-[1.08]" style={{ fontWeight: 700 }}>
            Choose Your <em className="text-[var(--igps-landing-btn-color)] not-italic">Educational Journey</em>
          </h1>
          <p className="text-[24px] font-medium max-w-[800px] mx-auto text-[var(--igps-landing-text-color)] leading-[1.1]" style={{ fontWeight: 500 }}>
            Select the program level that perfectly aligns with your <strong>academic goals</strong> and learning commitment
          </p>
        </div>

        {/* Level Cards */}
        <div className="grid lg:grid-cols-3 gap-[20px] mb-[60px]">
          {LEARNING_LEVELS.map((level) => (
            <div
              key={level.id}
              className={`cursor-pointer transition-all duration-300 bg-white rounded-[14px] border-0 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-[3px] ${
                selectedLevel === level.id
                  ? 'ring-2 ring-[var(--igps-landing-btn-color)] shadow-[0_4px_16px_rgba(0,113,227,0.15)]'
                  : ''
              }`}
              onClick={() => setSelectedLevel(level.id)}
            >
              <div className="p-[30px] text-center">
                <div className="mb-[20px]">
                  <h3 className="text-[28px] font-bold mb-[6px] text-[var(--igps-landing-text-color)] leading-[1.125]" style={{ fontWeight: 700 }}>
                    {level.name}
                  </h3>
                  <p className="text-[16px] font-medium text-[var(--igps-landing-text-color)] mb-[12px] leading-[1.25]" style={{ fontWeight: 500 }}>
                    {level.description}
                  </p>
                  <div className="inline-block bg-[#f8f8f8] text-[var(--igps-landing-btn-color)] px-[10px] py-[4px] rounded-[8px] text-[11px] font-medium uppercase tracking-[0.05em]" style={{ fontWeight: 500 }}>
                    {level.popularity}
                  </div>
                </div>

                <div className="space-y-[8px] mb-[20px] text-left">
                  {level.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-[10px]">
                      <Check className="h-[16px] w-[16px] text-[var(--igps-landing-btn-color)] mt-[1px] flex-shrink-0" />
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.4]" style={{ fontWeight: 400 }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedLevel === level.id && (
                  <div className="p-[16px] bg-[var(--igps-landing-btn-color)] rounded-[8px]">
                    <div className="flex items-center justify-center gap-[6px] text-white font-medium text-[13px]" style={{ fontWeight: 500 }}>
                      <Check className="h-[16px] w-[16px]" />
                      <strong>Selected</strong> — Ready to Continue
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>


        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedLevel}
            className={`inline-block px-[30px] py-[12px] rounded-[980px] text-[17px] font-normal transition-all duration-300 no-underline ${
              selectedLevel 
                ? 'bg-[var(--igps-landing-btn-color)] text-white hover:bg-[#0077ed] cursor-pointer'
                : 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
            }`}
            style={{ fontWeight: 400 }}
          >
            {selectedLevel ? (
              <span className="flex items-center gap-[8px]">
                <strong>Continue to Study Planning</strong>
                <ArrowRight className="h-[16px] w-[16px]" />
              </span>
            ) : (
              'Please select your learning level'
            )}
          </button>
          {selectedLevel && (
            <p className="text-[13px] text-[#86868b] mt-[15px] leading-[1.5]" style={{ fontWeight: 400 }}>
              Next: Design your <em>personalized study schedule</em>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}