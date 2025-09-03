'use client';

import Image from 'next/image';
import { BookOpen, Users, Award, Target, Heart, Globe, CheckCircle, Star } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About IGPS</h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              I GRAMMATICOS PLATFORM SOLUTION - Empowering students through innovative literacy education since 2015
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Target className="h-8 w-8 text-gray-700" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To revolutionize literacy education by providing comprehensive, personalized learning experiences that unlock every student's potential. We believe in making quality education accessible, engaging, and transformative for learners of all backgrounds and abilities.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Globe className="h-8 w-8 text-gray-700" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To become the global leader in innovative literacy solutions, creating a world where every child has the tools and support they need to become confident, capable readers and writers who can express themselves with clarity and creativity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-xl text-gray-600">A journey of passion, dedication, and educational innovation</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                Founded in 2015 by a team of passionate educators and literacy experts, IGPS began as a small tutoring center with a big dream: to transform how children learn to read and write.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What started as after-school sessions for a handful of students has grown into a comprehensive educational platform serving thousands of learners across multiple regions. Our journey has been marked by continuous innovation, unwavering commitment to quality, and deep understanding of each student's unique needs.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, IGPS offers a full spectrum of literacy programs, from early reading foundations to advanced writing techniques, all designed with one goal in mind: helping every student discover the joy and power of effective communication.
              </p>
            </div>
            
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">8+</div>
                  <p className="text-gray-600">Years of Excellence</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">10K+</div>
                  <p className="text-gray-600">Students Served</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">95%</div>
                  <p className="text-gray-600">Success Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">50+</div>
                  <p className="text-gray-600">Expert Educators</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Makes Us Different */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Makes Us Different</h2>
            <p className="text-xl text-gray-600">Our unique approach to literacy education</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <BookOpen className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Comprehensive Curriculum</h3>
              <p className="text-gray-600 text-center">
                Our research-backed programs cover everything from phonics to advanced literary analysis, ensuring no learning gaps.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Users className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Personalized Learning</h3>
              <p className="text-gray-600 text-center">
                Every student receives individualized attention and custom learning paths tailored to their unique needs and goals.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Award className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Proven Results</h3>
              <p className="text-gray-600 text-center">
                Our track record speaks for itself: improved test scores, enhanced confidence, and lifelong love for learning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Passion</h3>
              <p className="text-gray-600 text-sm">
                We love what we do and it shows in our dedication to each student's success
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600 text-sm">
                We maintain the highest standards in curriculum design and teaching methodology
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 text-sm">
                We foster a supportive environment where students and families thrive together
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm">
                We operate with transparency, honesty, and accountability in all our interactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-600">Meet the visionaries behind IGPS</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-gray-300 to-gray-400" />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Dr. Bri Ribaj</h3>
                <p className="text-gray-600 mb-3">Co-Founder</p>
                <p className="text-sm text-gray-600">
                  Pioneering educator with extensive experience in innovative literacy methodologies. Dedicated to transforming how students engage with reading and writing through personalized learning approaches.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-gray-300 to-gray-400" />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Lisa Chen</h3>
                <p className="text-gray-600 mb-3">Co-Founder</p>
                <p className="text-sm text-gray-600">
                  Educational technology expert and curriculum designer. Passionate about creating comprehensive learning solutions that adapt to each student's unique needs and learning style.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join Our Community?</h2>
          <p className="text-xl text-gray-200 mb-8">
            Experience the IGPS difference and unlock your child's full potential
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/booking/diagnosis"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Schedule Assessment
            </a>
            <a
              href="mailto:jackyandsky@gmail.com"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}