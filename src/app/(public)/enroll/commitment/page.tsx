'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Clock, Calendar, Target, Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const STUDY_OPTIONS = {
  booksPerPeriod: [
    {
      id: 'moderate',
      name: 'Moderate Pace',
      value: '3-5 books',
      description: 'Balanced approach for steady progress',
      timeCommitment: '4-6 hours/week'
    },
    {
      id: 'intensive',
      name: 'Intensive Study',
      value: '6-12 books',
      description: 'Accelerated learning for dedicated students',
      timeCommitment: '8-12 hours/week'
    },
    {
      id: 'custom',
      name: 'Customized',
      value: 'custom',
      description: 'Choose your own reading volume',
      timeCommitment: 'Varies by selection'
    }
  ],
  studyDuration: [
    {
      id: 'short',
      name: 'Short-term',
      value: '1-2 months',
      description: 'Quick intensive program',
      icon: '⚡',
      color: 'red'
    },
    {
      id: 'standard',
      name: 'Standard',
      value: '3-4 months',
      description: 'Most popular timeframe',
      icon: '📅',
      color: 'blue'
    },
    {
      id: 'extended',
      name: 'Extended',
      value: '5-6 months',
      description: 'Thorough deep-dive approach',
      icon: '📆',
      color: 'green'
    },
    {
      id: 'longterm',
      name: 'Long-term',
      value: '6+ months',
      description: 'Comprehensive mastery program',
      icon: '🗓️',
      color: 'purple'
    }
  ],
  weeklyTime: [
    {
      id: 'casual',
      name: 'Casual',
      value: '2-4 hours/week',
      description: 'Light commitment, flexible schedule',
      icon: '🌱',
      color: 'green'
    },
    {
      id: 'regular',
      name: 'Regular',
      value: '5-7 hours/week',
      description: 'Steady progress with good balance',
      icon: '⚖️',
      color: 'blue'
    },
    {
      id: 'dedicated',
      name: 'Dedicated',
      value: '8-10 hours/week',
      description: 'Serious commitment for faster results',
      icon: '🎯',
      color: 'orange'
    },
    {
      id: 'intensive',
      name: 'Intensive',
      value: '10+ hours/week',
      description: 'Maximum commitment for rapid mastery',
      icon: '🚀',
      color: 'purple'
    }
  ]
};

export default function CommitmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLevel = searchParams.get('level') || '';
  const courseId = searchParams.get('courseId') || '';
  
  const [selections, setSelections] = useState<{
    booksPerPeriod: string;
    studyDuration: string;
    weeklyTime: string;
    customBookCount: string;
  }>({
    booksPerPeriod: '',
    studyDuration: '',
    weeklyTime: '',
    customBookCount: ''
  });

  const handleSelection = (category: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleContinue = () => {
    const requiredFields: (keyof typeof selections)[] = ['booksPerPeriod', 'studyDuration', 'weeklyTime'];
    const allSelected = requiredFields.every(field => selections[field] !== '');
    const customValid = selections.booksPerPeriod !== 'custom' || selections.customBookCount !== '';
    
    if (allSelected && customValid) {
      // Store enrollment data in sessionStorage for the schedule page
      const enrollmentData = {
        type: 'enrollment',
        courseId: courseId,
        level: selectedLevel,
        booksPerPeriod: selections.booksPerPeriod === 'custom' ? `${selections.customBookCount} books` : selections.booksPerPeriod,
        studyDuration: selections.studyDuration,
        weeklyTime: selections.weeklyTime
      };
      
      sessionStorage.setItem('enrollmentData', JSON.stringify(enrollmentData));
      
      // Go directly to booking/schedule with enrollment type
      router.push('/booking/schedule?type=enrollment');
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    router.push(`/enroll${params.toString() ? '?' + params.toString() : ''}`);
  };

  const requiredFields: (keyof typeof selections)[] = ['booksPerPeriod', 'studyDuration', 'weeklyTime'];
  const canContinue = requiredFields.every(field => selections[field] !== '') && 
                     (selections.booksPerPeriod !== 'custom' || selections.customBookCount !== '');

  return (
    <div className="min-h-screen bg-[var(--igps-landing-background)]" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
      <div className="max-w-[1200px] mx-auto px-[20px] py-[60px]">
        <div className="text-center mb-[50px]">
          <h1 className="text-[40px] font-bold mb-[15px] text-[var(--igps-landing-text-color)] tracking-[-0.022em] leading-[1.08]" style={{ fontWeight: 700 }}>
            Design Your <em className="text-[var(--igps-landing-btn-color)] not-italic">Perfect Study Plan</em>
          </h1>
          <p className="text-[18px] font-medium max-w-[700px] mx-auto text-[var(--igps-landing-text-color)] leading-[1.23536]" style={{ fontWeight: 500 }}>
            Customize your learning experience with <strong>realistic commitments</strong> that fit your lifestyle
          </p>
        </div>
        
        {/* Books per Period */}
        <div className="mb-[50px]">
          <h2 className="text-[28px] font-bold mb-[8px] text-[var(--igps-landing-text-color)] text-center leading-[1.125]" style={{ fontWeight: 700 }}>
            Monthly Reading <em className="text-[var(--igps-landing-btn-color)] not-italic">Volume</em>
          </h2>
          <p className="text-[15px] text-center max-w-[500px] mx-auto mb-[30px] text-[var(--igps-landing-text-color)] leading-[1.5]" style={{ fontWeight: 400 }}>
            Choose based on your reading speed and <strong>available time commitment</strong>
          </p>
          
          <div className="grid lg:grid-cols-3 gap-[15px]">
            {STUDY_OPTIONS.booksPerPeriod.map((option) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-300 bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] ${
                  selections.booksPerPeriod === option.id
                    ? 'ring-2 ring-[var(--igps-landing-btn-color)] shadow-[0_4px_12px_rgba(0,113,227,0.15)]'
                    : ''
                }`}
                onClick={() => handleSelection('booksPerPeriod', option.id)}
              >
                <div className="p-[20px] text-center">
                  <h4 className="text-[18px] font-bold text-[var(--igps-landing-text-color)] mb-[6px] leading-[1.23536]" style={{ fontWeight: 700 }}>
                    {option.name}
                  </h4>
                  <p className="text-[24px] font-bold text-[var(--igps-landing-btn-color)] mb-[8px] leading-[1.125]" style={{ fontWeight: 700 }}>
                    {option.value !== 'custom' ? option.value : 'Custom'}
                  </p>
                  <p className="text-[13px] text-[var(--igps-landing-text-color)] mb-[12px] leading-[1.5]" style={{ fontWeight: 400 }}>
                    {option.description}
                  </p>
                  <div className="text-[12px] text-[#86868b] bg-[#f8f8f8] rounded-[6px] p-[8px]" style={{ fontWeight: 400 }}>
                    {option.timeCommitment}
                  </div>
                  {selections.booksPerPeriod === option.id && (
                    <div className="mt-[12px] flex items-center justify-center gap-[6px] text-white bg-[var(--igps-landing-btn-color)] rounded-[6px] p-[8px]">
                      <Check className="h-[14px] w-[14px]" />
                      <span className="font-medium text-[12px]" style={{ fontWeight: 500 }}>
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom Book Count Input */}
          {selections.booksPerPeriod === 'custom' && (
            <div className="mt-[20px] flex justify-center">
              <div className="max-w-[300px] w-full">
                <label className="block text-[15px] font-medium text-[var(--igps-landing-text-color)] mb-[8px] text-center leading-[1.47059]" style={{ fontWeight: 500 }}>
                  How many books per month?
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={selections.customBookCount}
                  onChange={(e) => setSelections(prev => ({...prev, customBookCount: e.target.value}))}
                  placeholder="Enter number"
                  className="w-full px-[15px] py-[12px] border border-[#e5e5e7] rounded-[8px] text-[15px] text-center focus:border-[var(--igps-landing-btn-color)] focus:outline-none transition-colors duration-200"
                  style={{ fontFamily: 'var(--igps-landing-font-family)', fontWeight: 400 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Study Duration */}
        <div className="mb-[50px]">
          <h2 className="text-[28px] font-bold mb-[8px] text-[var(--igps-landing-text-color)] text-center leading-[1.125]" style={{ fontWeight: 700 }}>
            Program <em className="text-[var(--igps-landing-btn-color)] not-italic">Duration</em>
          </h2>
          <p className="text-[15px] text-center max-w-[500px] mx-auto mb-[30px] text-[var(--igps-landing-text-color)] leading-[1.5]" style={{ fontWeight: 400 }}>
            Choose the timeframe that aligns with your <strong>educational objectives</strong>
          </p>
          
          <div className="grid lg:grid-cols-4 gap-[12px]">
            {STUDY_OPTIONS.studyDuration.map((option) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-300 bg-white rounded-[10px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] ${
                  selections.studyDuration === option.id
                    ? 'ring-2 ring-[var(--igps-landing-btn-color)] shadow-[0_3px_10px_rgba(0,113,227,0.15)]'
                    : ''
                }`}
                onClick={() => handleSelection('studyDuration', option.id)}
              >
                <div className="p-[16px] text-center">
                  <h4 className="text-[16px] font-bold text-[var(--igps-landing-text-color)] mb-[6px] leading-[1.25]" style={{ fontWeight: 700 }}>
                    {option.name}
                  </h4>
                  <p className="text-[20px] font-bold text-[#28a745] mb-[8px] leading-[1.125]" style={{ fontWeight: 700 }}>
                    {option.value}
                  </p>
                  <p className="text-[12px] text-[var(--igps-landing-text-color)] leading-[1.4]" style={{ fontWeight: 400 }}>
                    {option.description}
                  </p>
                  {selections.studyDuration === option.id && (
                    <div className="mt-[10px] flex items-center justify-center gap-[4px] text-white bg-[var(--igps-landing-btn-color)] rounded-[4px] p-[6px]">
                      <Check className="h-[12px] w-[12px]" />
                      <span className="text-[11px] font-medium" style={{ fontWeight: 500 }}>
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Time Commitment */}
        <div className="mb-[60px]">
          <h2 className="text-[28px] font-bold mb-[8px] text-[var(--igps-landing-text-color)] text-center leading-[1.125]" style={{ fontWeight: 700 }}>
            Weekly <em className="text-[var(--igps-landing-btn-color)] not-italic">Commitment</em>
          </h2>
          <p className="text-[15px] text-center max-w-[500px] mx-auto mb-[30px] text-[var(--igps-landing-text-color)] leading-[1.5]" style={{ fontWeight: 400 }}>
            Be <strong>realistic</strong> about your schedule for sustainable progress
          </p>
          
          <div className="grid lg:grid-cols-4 gap-[12px]">
            {STUDY_OPTIONS.weeklyTime.map((option) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-300 bg-white rounded-[10px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] ${
                  selections.weeklyTime === option.id
                    ? 'ring-2 ring-[var(--igps-landing-btn-color)] shadow-[0_3px_10px_rgba(0,113,227,0.15)]'
                    : ''
                }`}
                onClick={() => handleSelection('weeklyTime', option.id)}
              >
                <div className="p-[16px] text-center">
                  <h4 className="text-[16px] font-bold text-[var(--igps-landing-text-color)] mb-[6px] leading-[1.25]" style={{ fontWeight: 700 }}>
                    {option.name}
                  </h4>
                  <p className="text-[20px] font-bold text-[#8b5a2b] mb-[8px] leading-[1.125]" style={{ fontWeight: 700 }}>
                    {option.value}
                  </p>
                  <p className="text-[12px] text-[var(--igps-landing-text-color)] leading-[1.4]" style={{ fontWeight: 400 }}>
                    {option.description}
                  </p>
                  {selections.weeklyTime === option.id && (
                    <div className="mt-[10px] flex items-center justify-center gap-[4px] text-white bg-[var(--igps-landing-btn-color)] rounded-[4px] p-[6px]">
                      <Check className="h-[12px] w-[12px]" />
                      <span className="text-[11px] font-medium" style={{ fontWeight: 500 }}>
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-[40px] border-t border-[#e5e5e7]">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-[8px] text-[var(--igps-landing-link-color)] text-[17px] font-normal transition-colors duration-300 hover:text-[var(--igps-landing-btn-color)] no-underline"
            style={{ fontWeight: 400 }}
          >
            <ArrowLeft className="h-[16px] w-[16px]" />
            Back to Level Selection
          </button>
          
          <div className="text-center">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`inline-block px-[30px] py-[12px] rounded-[980px] text-[17px] font-normal transition-all duration-300 no-underline ${
                canContinue 
                  ? 'bg-[var(--igps-landing-btn-color)] text-white hover:bg-[#0077ed] cursor-pointer'
                  : 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
              }`}
              style={{ fontWeight: 400 }}
            >
              {canContinue ? (
                <span className="flex items-center gap-[8px]">
                  <strong>Continue to Contact Info</strong>
                  <ArrowRight className="h-[16px] w-[16px]" />
                </span>
              ) : (
                'Please complete all selections'
              )}
            </button>
            {canContinue && (
              <p className="text-[13px] text-[#86868b] mt-[15px] leading-[1.5]" style={{ fontWeight: 400 }}>
                Final step: <em>Share your contact details</em>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}