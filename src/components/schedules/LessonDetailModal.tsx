'use client';

import React, { useState } from 'react';
import { Modal, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LessonBookManager } from '@/components/relationships/LessonBookManager';
import { LessonTaskManager } from '@/components/relationships/LessonTaskManager';
import { Lesson } from '@/types/schedule';
import { Clock, Info, Book, Edit, CheckSquare } from 'lucide-react';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onEdit: (lesson: Lesson) => void;
  onUpdate?: () => void;
}

export function LessonDetailModal({ isOpen, onClose, lesson, onEdit, onUpdate }: LessonDetailModalProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!lesson) return null;

  const handleRelationshipUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesson.title} size="xl" className="!w-[800px] mx-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="books" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Books
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800">Lesson Details</h3>
              <p className="mt-2 text-sm text-gray-600">{lesson.description || 'No description provided.'}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5"/>
                    <div>
                        <p className="font-medium text-gray-500">Time</p>
                        <p>{new Date(lesson.date).toLocaleDateString()} at {lesson.start_time} - {lesson.end_time}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-gray-400 mt-0.5"/>
                    <div>
                        <p className="font-medium text-gray-500">Status</p>
                        <Badge variant={lesson.status === 'completed' ? 'success' : 'default'} size="sm">{lesson.status}</Badge>
                    </div>
                </div>
            </div>

            {lesson.description && (
                 <div className="pt-2">
                    <h4 className="font-medium text-gray-800">Description</h4>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{lesson.description}</p>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="books" className="mt-6">
          <LessonBookManager 
            lessonId={lesson.id}
            courseId={lesson.course_id}
            onUpdate={handleRelationshipUpdate}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <LessonTaskManager 
            lessonId={lesson.id}
            courseId={lesson.course_id}
            onUpdate={handleRelationshipUpdate}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={() => onEdit(lesson)} leftIcon={<Edit className="h-4 w-4"/>}>Edit Lesson</Button>
      </div>
    </Modal>
  );
}