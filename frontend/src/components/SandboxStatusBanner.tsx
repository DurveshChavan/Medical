import React from 'react';
import { Database, CheckCircle } from 'lucide-react';

interface SandboxStatusBannerProps {
  isSandboxMode: boolean;
  uploadedFilename?: string | null;
  isUsingTempDatabase?: boolean;
}

const SandboxStatusBanner: React.FC<SandboxStatusBannerProps> = ({ 
  isSandboxMode, 
  uploadedFilename,
  isUsingTempDatabase = false
}) => {
  if (!isSandboxMode && !isUsingTempDatabase) return null;

  return (
    <div 
      className="sandbox-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
        fontSize: '0.875rem',
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
        borderBottom: '2px solid #047857'
      }}>
      <Database size={16} />
      <span>
        🟢 Analyzing Uploaded Data: {uploadedFilename || 'Temporary Database'}
      </span>
      <CheckCircle size={16} style={{ opacity: 0.8 }} />
    </div>
  );
};

export default SandboxStatusBanner;
