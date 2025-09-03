'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  reports: Report[];
}

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'chart' | 'table' | 'summary';
  lastGenerated?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'on-demand';
}

const reportCategories: ReportCategory[] = [
  {
    id: 'enrollment',
    name: 'Enrollment Reports',
    description: 'Student registration trends and course popularity',
    icon: UserGroupIcon,
    color: 'blue',
    reports: [
      { id: 'reg-trends', title: 'Registration Trends', description: 'Monthly enrollment statistics', type: 'chart' },
      { id: 'course-pop', title: 'Course Popularity', description: 'Most enrolled courses', type: 'table' },
      { id: 'completion-rate', title: 'Completion Rates', description: 'Course completion analytics', type: 'chart' },
      { id: 'schedule-util', title: 'Schedule Utilization', description: 'Group capacity analysis', type: 'summary' }
    ]
  },
  {
    id: 'performance',
    name: 'Performance Reports',
    description: 'Student progress and academic metrics',
    icon: AcademicCapIcon,
    color: 'green',
    reports: [
      { id: 'progress-track', title: 'Student Progress', description: 'Individual progress tracking', type: 'table' },
      { id: 'grade-dist', title: 'Grade Distribution', description: 'Grade breakdown by course', type: 'chart' },
      { id: 'assessment', title: 'Assessment Results', description: 'Test and quiz analytics', type: 'summary' },
      { id: 'learning-outcomes', title: 'Learning Outcomes', description: 'Objective achievement rates', type: 'chart' }
    ]
  },
  {
    id: 'usage',
    name: 'Usage Reports',
    description: 'Platform activity and resource utilization',
    icon: ChartBarIcon,
    color: 'purple',
    reports: [
      { id: 'platform-activity', title: 'Platform Activity', description: 'User engagement metrics', type: 'chart' },
      { id: 'login-patterns', title: 'Login Patterns', description: 'User access frequency', type: 'table' },
      { id: 'resource-util', title: 'Resource Utilization', description: 'Content usage statistics', type: 'summary' },
      { id: 'feature-adoption', title: 'Feature Adoption', description: 'Feature usage rates', type: 'chart' }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    description: 'Revenue, payments, and billing analytics',
    icon: CurrencyDollarIcon,
    color: 'yellow',
    reports: [
      { id: 'revenue', title: 'Revenue Summary', description: 'Monthly revenue breakdown', type: 'chart' },
      { id: 'payment-status', title: 'Payment Status', description: 'Transaction success rates', type: 'table' },
      { id: 'subscription', title: 'Subscription Metrics', description: 'Recurring revenue analysis', type: 'summary' },
      { id: 'forecasting', title: 'Revenue Forecast', description: 'Projected income trends', type: 'chart' }
    ]
  }
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('enrollment');
  const [dateRange, setDateRange] = useState('last30days');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const currentCategory = reportCategories.find(cat => cat.id === selectedCategory);

  const handleGenerateReport = (report: Report) => {
    setSelectedReport(report);
    // In real implementation, this would trigger report generation
    console.log('Generating report:', report);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // Implementation would handle actual export
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and analyze comprehensive reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>
            <ChartPieIcon className="h-4 w-4 mr-2" />
            {compareMode ? 'Exit Compare' : 'Compare Periods'}
          </Button>
          <Button variant="primary">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </Select>
            </div>

            {compareMode && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare With</label>
                <Select className="w-full">
                  <option value="previousPeriod">Previous Period</option>
                  <option value="lastYear">Same Period Last Year</option>
                  <option value="lastQuarter">Last Quarter</option>
                </Select>
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" size="sm">
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Categories Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 w-full">
          {reportCategories.map(category => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {reportCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Cards */}
              {category.reports.map(report => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                      </div>
                      <Badge variant={report.type === 'chart' ? 'primary' : report.type === 'table' ? 'secondary' : 'warning'}>
                        {report.type}
                      </Badge>
                    </div>

                    {/* Sample Preview */}
                    <div className="mb-4">
                      {report.type === 'chart' && (
                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                          <DocumentChartBarIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {report.type === 'table' && (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                          ))}
                        </div>
                      )}
                      {report.type === 'summary' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-blue-600">142</p>
                            <p className="text-xs text-gray-600">Total</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-green-600">+12%</p>
                            <p className="text-xs text-gray-600">Growth</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-purple-600">89%</p>
                            <p className="text-xs text-gray-600">Success</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {report.lastGenerated && (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            Updated 2h ago
                          </span>
                        )}
                        {report.frequency && (
                          <Badge variant="outline" className="text-xs">
                            {report.frequency}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateReport(report)}
                        >
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport('pdf')}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Stats for Category */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reports Generated</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Scheduled</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Exported</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <ArrowDownTrayIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Shared</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                    <UserGroupIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}