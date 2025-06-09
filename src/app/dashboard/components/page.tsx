'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Textarea,
  Modal,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  SearchBox,
  FilterPanel,
  Badge,
  Spinner,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { Home, Settings, Users, FileText } from 'lucide-react';

export default function ComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
  ];

  const filters = [
    {
      id: 'status',
      label: 'Status',
      type: 'checkbox' as const,
      options: [
        { value: 'active', label: 'Active', count: 12 },
        { value: 'inactive', label: 'Inactive', count: 5 },
        { value: 'pending', label: 'Pending', count: 3 },
      ],
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'radio' as const,
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
    {
      id: 'price',
      label: 'Price Range',
      type: 'range' as const,
      min: 0,
      max: 1000,
      step: 10,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">UI Components</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          A showcase of all available UI components
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <Card.Header>
          <Card.Title>Tabs Component</Card.Title>
        </Card.Header>
        <Card.Content>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p>This is the overview tab content.</p>
            </TabsContent>
            <TabsContent value="analytics">
              <p>This is the analytics tab content.</p>
            </TabsContent>
            <TabsContent value="reports">
              <p>This is the reports tab content.</p>
            </TabsContent>
          </Tabs>
        </Card.Content>
      </Card>

      {/* Buttons */}
      <Card>
        <Card.Header>
          <Card.Title>Buttons</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<Home className="h-4 w-4" />}>With Icon</Button>
            <Button rightIcon={<Settings className="h-4 w-4" />}>With Icon</Button>
            <Button fullWidth>Full Width</Button>
          </div>
        </Card.Content>
      </Card>

      {/* Form Elements */}
      <Card>
        <Card.Header>
          <Card.Title>Form Elements</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Text Input"
              placeholder="Enter text..."
              helperText="This is helper text"
            />
            <Input
              label="Email Input"
              type="email"
              placeholder="email@example.com"
              required
            />
            <Input
              label="Password Input"
              type="password"
              placeholder="Enter password..."
            />
            <Input
              label="With Error"
              error="This field is required"
              placeholder="Enter text..."
            />
          </div>

          <Select
            label="Select Input"
            options={selectOptions}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            placeholder="Choose an option..."
          />

          <Textarea
            label="Textarea"
            placeholder="Enter long text..."
            rows={4}
            helperText="Max 500 characters"
          />

          <SearchBox
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={(value) => console.log('Search:', value)}
            fullWidth
          />
        </Card.Content>
      </Card>

      {/* Badges */}
      <Card>
        <Card.Header>
          <Card.Title>Badges</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
            <Badge rounded>Rounded</Badge>
            <Badge dot>With Dot</Badge>
          </div>
        </Card.Content>
      </Card>

      {/* Table */}
      <Card>
        <Card.Header>
          <Card.Title>Table</Card.Title>
        </Card.Header>
        <Card.Content>
          <Table variant="striped">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card.Content>
      </Card>

      {/* Empty Table */}
      <Card>
        <Card.Header>
          <Card.Title>Empty Table</Card.Title>
        </Card.Header>
        <Card.Content>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty message="No data found" icon={<FileText className="h-8 w-8" />} />
            </TableBody>
          </Table>
        </Card.Content>
      </Card>

      {/* Modal */}
      <Card>
        <Card.Header>
          <Card.Title>Modal</Card.Title>
        </Card.Header>
        <Card.Content>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            size="md"
          >
            <p>This is the modal content. You can put any content here.</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
        </Card.Content>
      </Card>

      {/* Filter Panel */}
      <Card>
        <Card.Header>
          <Card.Title>Filter Panel</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="max-w-xs">
            <FilterPanel
              filters={filters}
              values={filterValues}
              onChange={(filterId, value) => {
                setFilterValues({ ...filterValues, [filterId]: value });
              }}
              onReset={() => setFilterValues({})}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Pagination */}
      <Card>
        <Card.Header>
          <Card.Title>Pagination</Card.Title>
        </Card.Header>
        <Card.Content>
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
          />
        </Card.Content>
      </Card>

      {/* Loading States */}
      <Card>
        <Card.Header>
          <Card.Title>Loading States</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex items-center space-x-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
            <Spinner variant="secondary" />
            <div className="bg-blue-600 p-4 rounded">
              <Spinner variant="white" />
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
