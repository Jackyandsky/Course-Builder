'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, Send, ChevronLeft, User, Mail, Phone, ArrowRight, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthWrapper from './AuthWrapper';

function ProgressReviewPageContent() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Store review data in sessionStorage for the booking page
    const reviewData = {
      currentGrade: data.currentGrade,
      duration: data.duration,
      reviewType: data.reviewType,
      concerns: data.concerns,
      additionalComments: data.comments,
      userEmail: user?.email
    };
    
    sessionStorage.setItem('progressReviewData', JSON.stringify(reviewData));
    
    // Redirect to schedule booking page
    setTimeout(() => {
      router.push(`/booking/schedule?type=progress-review&grade=${data.currentGrade}`);
    }, 500);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progress Review Request</h1>
              <p className="text-gray-600 mt-1">Schedule a comprehensive review of your child&apos;s academic progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Academic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Academic Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Grade Level *
                  </label>
                  <select
                    name="currentGrade"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select grade</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration Since Enrollment *
                  </label>
                  <select
                    name="duration"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select duration</option>
                    <option value="Less than 3 months">Less than 3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="More than 2 years">More than 2 years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Review Type */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                Review Type
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reviewType"
                    value="Comprehensive Academic Review"
                    required
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Comprehensive Academic Review</p>
                    <p className="text-sm text-gray-600">Full assessment of reading, writing, and comprehension skills</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reviewType"
                    value="Focused Area Review"
                    required
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Focused Area Review</p>
                    <p className="text-sm text-gray-600">Targeted review of specific areas of concern</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reviewType"
                    value="Progress Check-in"
                    required
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Progress Check-in</p>
                    <p className="text-sm text-gray-600">Brief review of current progress and next steps</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Concern (Optional)
                  </label>
                  <textarea
                    name="concerns"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                    placeholder="Please describe any specific areas where you'd like us to focus during the review..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                    placeholder="Any other information you'd like to share..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  * Required fields
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  <span>{isSubmitting ? 'Processing...' : 'Next: Schedule Appointment'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Processing Message */}
              {isSubmitting && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                  <p className="font-medium">Preparing your information...</p>
                  <p className="text-sm mt-1">You will be redirected to schedule your appointment.</p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3">What to Expect</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>A comprehensive review of your child's academic progress</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Detailed feedback on strengths and areas for improvement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Personalized recommendations for continued growth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Discussion of next steps and goal setting</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export with authentication wrapper
export default function ProgressReviewPage() {
  return (
    <AuthWrapper>
      <ProgressReviewPageContent />
    </AuthWrapper>
  );
}