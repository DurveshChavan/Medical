import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSandboxStatus } from '@/api/upload';

interface SandboxContextType {
  isSandboxMode: boolean;
  uploadedFilename: string | null;
  refreshSandboxStatus: () => Promise<void>;
  triggerDataRefresh: () => void;
  dataRefreshTrigger: number;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

interface SandboxProviderProps {
  children: ReactNode;
}

export const SandboxProvider: React.FC<SandboxProviderProps> = ({ children }) => {
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  const refreshSandboxStatus = async () => {
    try {
      const status = await getSandboxStatus();
      setIsSandboxMode(status.sandbox_status?.is_temp_mode || false);
      setUploadedFilename(status.sandbox_status?.current_upload_file || null);
    } catch (error) {
      console.error('Failed to get sandbox status:', error);
    }
  };

  const triggerDataRefresh = () => {
    setDataRefreshTrigger(prev => prev + 1);
  };

  // Check sandbox status on mount
  useEffect(() => {
    refreshSandboxStatus();
  }, []);

  const value: SandboxContextType = {
    isSandboxMode,
    uploadedFilename,
    refreshSandboxStatus,
    triggerDataRefresh,
    dataRefreshTrigger
  };

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
};

export const useSandbox = (): SandboxContextType => {
  const context = useContext(SandboxContext);
  if (context === undefined) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
};