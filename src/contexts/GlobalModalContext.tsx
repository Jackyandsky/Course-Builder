'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalModalContextType {
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  isModalOpen: (modalId: string) => boolean;
}

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined);

export const GlobalModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (modalId: string, data?: any) => {
    setActiveModal(modalId);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const isModalOpen = (modalId: string) => {
    return activeModal === modalId;
  };

  return (
    <GlobalModalContext.Provider value={{
      activeModal,
      modalData,
      openModal,
      closeModal,
      isModalOpen
    }}>
      {children}
    </GlobalModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider');
  }
  return context;
};