'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, Check, X, Sparkles, Zap, 
  PenTool, FileText, ChevronDown, ChevronUp,
  MessageSquare, Clock, Infinity
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  description: string;
  buttonText: string;
  buttonVariant: 'outline' | 'primary' | 'default';
  popular?: boolean;
  features: {
    name: string;
    value: string | boolean;
    highlight?: boolean;
  }[];
}

interface FAQ {
  question: string;
  answer: string;
}

export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/account/subscription');
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.isPremium || false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      billing: 'forever',
      description: 'Get started with basic learning tools',
      buttonText: 'Current Plan',
      buttonVariant: 'outline',
      features: [
        { name: 'Course Access', value: '3 courses', highlight: true },
        { name: 'Paragraph Generator', value: true },
        { name: 'Basic Study Materials', value: true },
        { name: 'Community Forum', value: true },
        { name: 'Download Resources', value: false },
        { name: 'AI Study Assistant', value: false },
        { name: 'Priority Support', value: false },
        { name: 'Certificate of Completion', value: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$15' : '$150',
      billing: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'Perfect for serious learners and educators',
      buttonText: isSubscribed ? 'Current Plan' : 'Get Started',
      buttonVariant: 'primary',
      popular: true,
      features: [
        { name: 'Course Access', value: 'Unlimited', highlight: true },
        { name: 'All Free features', value: true },
        { name: 'AI Study Assistant', value: true },
        { name: 'Paragraph Generator Pro', value: true },
        { name: 'Download Resources', value: true },
        { name: 'Certificate of Completion', value: true },
        { name: 'Email Support', value: true },
        { name: 'Custom Learning Path', value: false },
      ]
    },
    {
      id: 'max',
      name: 'Max',
      price: billingCycle === 'monthly' ? '$30' : '$300',
      billing: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For institutions and power users',
      buttonText: 'Contact Sales',
      buttonVariant: 'default',
      features: [
        { name: 'Course Access', value: 'All + Premium', highlight: true },
        { name: 'All Pro features', value: true },
        { name: 'Custom Learning Path', value: true },
        { name: 'Analytics Dashboard', value: true },
        { name: 'API Access', value: true },
        { name: 'Team Management', value: true },
        { name: 'Dedicated Support', value: true },
        { name: 'White Label Options', value: true },
      ]
    }
  ];

  const faqs: FAQ[] = [
    {
      question: 'What learning tools are included?',
      answer: 'All plans include access to our core learning platform. Free users get access to 3 courses and basic tools like the paragraph generator. Pro users get unlimited course access plus AI study assistant and advanced tools. Max users get everything plus analytics and team management.'
    },
    {
      question: 'Can I change my plan later?',
      answer: 'Yes, you can upgrade or downgrade your subscription at any time. When you upgrade, you\'ll get immediate access to additional features. If you downgrade, your new limits will take effect at the start of your next billing cycle.'
    },
    {
      question: 'Do I get certificates?',
      answer: 'Certificates of completion are available for Pro and Max plan members. Once you complete a course, you can download your certificate from your dashboard.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Our Free plan gives you permanent access to 3 courses and basic tools. This allows you to experience our platform before upgrading to access unlimited courses and advanced features.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely through Stripe.'
    },
    {
      question: 'Can I download course materials?',
      answer: 'Course material downloads are available for Pro and Max plan members. You can download PDFs, videos, and other resources for offline study.'
    }
  ];

  const featureCategories = [
    { 
      name: 'Learning Tools', 
      features: ['Paragraph Generator', 'Paragraph Generator Pro', 'AI Study Assistant'] 
    },
    { 
      name: 'Course Access', 
      features: ['Course Access', 'Basic Study Materials', 'Download Resources', 'Custom Learning Path'] 
    },
    { 
      name: 'Certification', 
      features: ['Certificate of Completion'] 
    },
    { 
      name: 'Support', 
      features: ['Community Forum', 'Email Support', 'Dedicated Support', 'Priority Support'] 
    },
    { 
      name: 'Advanced', 
      features: ['API Access', 'Team Management', 'Analytics Dashboard', 'White Label Options'] 
    }
  ];

  const handlePlanClick = (plan: PricingPlan) => {
    if (plan.id === 'free' && !isSubscribed) {
      return; // Already on free plan
    }
    if (plan.id === 'max') {
      // Contact sales
      window.location.href = 'mailto:support@igps.com?subject=IGPS Max Plan Inquiry';
    } else if (plan.id === 'pro' && !isSubscribed) {
      // Navigate to tools page
      router.push('/tools');
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const getFeatureValue = (plan: PricingPlan, featureName: string) => {
    const feature = plan.features.find(f => f.name === featureName);
    return feature ? feature.value : false;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Choose Your Learning Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock unlimited courses, AI tools, and premium features to accelerate your learning journey
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              billingCycle === 'monthly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              billingCycle === 'yearly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Yearly
            <Badge variant="success" size="xs" className="ml-2">Save 17%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mt-12 overflow-visible items-stretch">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer flex flex-col ${
              plan.popular 
                ? 'border-2 border-blue-500 shadow-xl hover:shadow-2xl' 
                : 'border border-gray-200 hover:border-gray-300'
            }`}
          >
            
            <div className="space-y-6 flex flex-col h-full">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="ml-1 text-gray-600">{plan.billing}</span>
              </div>

              <Button
                variant={plan.buttonVariant}
                className="w-full transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handlePlanClick(plan)}
                disabled={plan.id === 'free' && !isSubscribed}
              >
                {plan.buttonText}
              </Button>

              <div className="space-y-3 pt-6 border-t border-gray-200 flex-1">
                <h4 className="text-sm font-medium text-gray-900">Features included:</h4>
                {plan.features.slice(0, 8).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.value === true ? (
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : feature.value === false ? (
                      <X className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Zap className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className={`text-sm ${
                        feature.value === false ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {feature.name}
                      </span>
                      {typeof feature.value === 'string' && (
                        <span className={`ml-2 text-sm font-medium ${
                          feature.highlight ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          ({feature.value})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Compare plans and features</h2>
          <p className="mt-2 text-gray-600">See what's included in each plan to find the right option for your needs</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Features</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Free</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">
                    Pro
                    {pricingPlans[1].popular && (
                      <Badge variant="primary" size="xs" className="ml-2">Popular</Badge>
                    )}
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-900">Max</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={4} className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((featureName, featureIndex) => {
                      const hasFreeFeature = pricingPlans[0].features.some(f => f.name === featureName);
                      if (!hasFreeFeature && !pricingPlans[1].features.some(f => f.name === featureName) && !pricingPlans[2].features.some(f => f.name === featureName)) {
                        return null;
                      }
                      
                      return (
                        <tr key={featureIndex} className="border-b border-gray-100">
                          <td className="px-6 py-4 text-sm text-gray-700">{featureName}</td>
                          {pricingPlans.map((plan) => {
                            const value = getFeatureValue(plan, featureName);
                            return (
                              <td key={plan.id} className="text-center px-6 py-4">
                                {value === true ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : value === false ? (
                                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                                ) : (
                                  <span className="text-sm font-medium text-gray-900">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          <p className="mt-2 text-gray-600">Find answers to common questions about our pricing and features</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left flex items-start justify-between gap-4 group"
              >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{faq.question}</h3>
                {expandedFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:text-blue-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:text-blue-500" />
                )}
              </button>
              {expandedFAQ === index && (
                <p className="mt-4 text-gray-600">{faq.answer}</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-12 text-center transition-all duration-300 hover:shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Our team is here to help you choose the right plan for your needs
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="primary"
            onClick={() => window.location.href = 'mailto:support@igps.com'}
          >
            Contact Support
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/tools/genParagraph')}
          >
            Try Free Tool
          </Button>
        </div>
      </div>
    </div>
  );
}