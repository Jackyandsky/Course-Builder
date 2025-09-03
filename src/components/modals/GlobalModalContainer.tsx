'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGlobalModal } from '@/contexts/GlobalModalContext';
import { 
  X, GripHorizontal, PenTool, FileText
} from 'lucide-react';
import { ParagraphGeneratorModal } from '@/app/(account)/account/premium/ParagraphGeneratorModal';
import { EssayBuilderModal } from '@/app/(account)/account/premium/EssayBuilderModal';
import { FiveSentenceEssayBuilder } from '@/app/(account)/account/premium/FiveSentenceEssayBuilder';

// Draggable Modal Wrapper
const DraggableModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon,
  children 
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: any;
  children: React.ReactNode;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset position when modal opens
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute inset-0">
        {/* Modal panel - positioned absolutely so it doesn't block clicks */}
        <div 
          ref={modalRef}
          className="absolute top-20 left-1/2 w-full max-w-6xl overflow-hidden text-left align-middle bg-white shadow-2xl rounded-lg pointer-events-auto"
          style={{
            transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Draggable Header */}
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 cursor-grab select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripHorizontal className="h-4 w-4 text-white/60" />
                {Icon && (
                  <div className="p-1.5 bg-white/20 rounded">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-white">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Global Modal Container
export const GlobalModalContainer = () => {
  const { activeModal, closeModal } = useGlobalModal();
  const [essayBuilderTitle, setEssayBuilderTitle] = useState("5/5/5 Essay Builder");

  const handleEssayTitleChange = (title: string) => {
    setEssayBuilderTitle(title ? `5/5/5 Essay Builder (${title})` : "5/5/5 Essay Builder");
  };

  // Reset title when modal closes
  useEffect(() => {
    if (activeModal !== 'five-sentence-essay') {
      setEssayBuilderTitle("5/5/5 Essay Builder");
    }
  }, [activeModal]);

  return (
    <>
      {/* 5-Paragraph Essay Builder Modal - 3-5 Sentences per Paragraph */}
      <DraggableModal
        isOpen={activeModal === 'five-sentence-essay'}
        onClose={closeModal}
        title={essayBuilderTitle}
        icon={FileText}
      >
        <FiveSentenceEssayBuilder onTitleChange={handleEssayTitleChange} />
      </DraggableModal>

      {/* Alternative Essay Builder Modal - Flexible Structure */}
      <DraggableModal
        isOpen={activeModal === 'essay-builder'}
        onClose={closeModal}
        title="Essay Builder (Flexible)"
        icon={FileText}
      >
        <EssayBuilderModal />
      </DraggableModal>

      {/* Paragraph Generator Modal */}
      <DraggableModal
        isOpen={activeModal === 'paragraph-generator'}
        onClose={closeModal}
        title="Single Paragraph Generator"
        icon={PenTool}
      >
        <ParagraphGeneratorModal />
      </DraggableModal>

      {/* Add more modals here as needed */}
    </>
  );
};