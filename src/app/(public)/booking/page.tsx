'use client';

import Link from 'next/link';
import { GraduationCap, FileText, Calendar, ArrowRight } from 'lucide-react';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">IGPS Booking Services</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schedule diagnostic assessments and progress reviews to support your child&apos;s academic journey
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Diagnosis Card */}
          <Link href="/booking/diagnosis" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
              <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-8 text-white">
                <GraduationCap className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Diagnostic Assessment</h2>
                <p className="text-gray-200">Comprehensive enrollment evaluation for grades 1-12</p>
              </div>
              <div className="p-8">
                <h3 className="font-semibold text-gray-800 mb-4">What&apos;s Included:</h3>
                <ul className="space-y-3 text-gray-600 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Grade-appropriate reading comprehension tests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Writing skill assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Vocabulary and language evaluation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Personalized placement recommendations</span>
                  </li>
                </ul>
                <div className="flex items-center text-gray-700 font-medium group-hover:translate-x-2 transition-transform">
                  <span>Schedule Assessment</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </div>
              </div>
            </div>
          </Link>

          {/* Progress Review Card */}
          <Link href="/booking/progress-review" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 p-8 text-white">
                <FileText className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Progress Review</h2>
                <p className="text-gray-200">Track and celebrate your child&apos;s academic growth</p>
              </div>
              <div className="p-8">
                <h3 className="font-semibold text-gray-800 mb-4">Review Options:</h3>
                <ul className="space-y-3 text-gray-600 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Comprehensive academic review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Focused area assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Progress check-in consultation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">✓</span>
                    <span>Goal setting and recommendations</span>
                  </li>
                </ul>
                <div className="flex items-center text-gray-700 font-medium group-hover:translate-x-2 transition-transform">
                  <span>Request Review</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-start gap-4">
            <Calendar className="h-8 w-8 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6 text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">1. Choose Service</h4>
                  <p className="text-sm">Select either a diagnostic assessment for new students or a progress review for current students.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">2. Complete Form</h4>
                  <p className="text-sm">Fill out the required information and submit your request through our secure form.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">3. Receive Confirmation</h4>
                  <p className="text-sm">We&apos;ll contact you within 24 hours to confirm your appointment and provide further details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">Have questions about our booking services?</p>
          <p>
            Contact us at{' '}
            <a href="mailto:jackyandsky@gmail.com" className="text-gray-700 hover:text-gray-900 font-medium">
              jackyandsky@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}