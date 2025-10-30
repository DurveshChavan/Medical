import React, { useState } from 'react';
import { Upload, FileText, Download, RefreshCw } from 'lucide-react';
import ChartCard from '@/components/ChartCard';

const DataUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, replace with:
      // const response = await uploadSalesData(selectedFile);
      
      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${selectedFile.name}. Processed 1,234 records.`
      });
      setSelectedFile(null);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload file. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRebuildDatabase = async () => {
    if (!confirm('Are you sure you want to rebuild the database? This may take a few minutes.')) {
      return;
    }

    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setUploadStatus({
        type: 'success',
        message: 'Database rebuilt successfully!'
      });
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to rebuild database.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadStatus({
        type: 'success',
        message: `Data exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Export failed.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Data Management</h1>
        <p className="page-description">
          Upload, export, and manage pharmacy data
        </p>
      </div>

      {/* Status Message */}
      {uploadStatus.type && (
        <div 
          style={{
            padding: 'var(1.5rem)',
            marginBottom: 'var(2rem)',
            borderRadius: 'var(--radius-lg)',
            background: uploadStatus.type === 'success' 
              ? 'var(--success-light)' 
              : uploadStatus.type === 'error'
              ? 'var(--destructive-light)'
              : 'var(--secondary-light)',
            border: uploadStatus.type === 'success' ? '2px solid var(--success)' : uploadStatus.type === 'error' ? '2px solid var(--destructive)' : '1px solid var(--border)',
            color: uploadStatus.type === 'success' ? 'var(--success)' : uploadStatus.type === 'error' ? 'var(--destructive)' : 'var(--secondary)',
            boxShadow: uploadStatus.type === 'success' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : uploadStatus.type === 'error' ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(1rem)',
            fontWeight: uploadStatus.type === 'success' ? '600' : 'normal'
          }}
        >
          {uploadStatus.type === 'success' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          )}
          {uploadStatus.type === 'error' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
          {uploadStatus.message}
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: 'var(2rem)' }}>
        {/* Upload Section */}
        <ChartCard title="Upload Sales Data" subtitle="Import CSV files with sales records">
          <div style={{ 
            border: `2px dashed ${uploadStatus.type === 'success' ? 'var(--success)' : uploadStatus.type === 'error' ? 'var(--destructive)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(3rem)',
            textAlign: 'center',
            marginBottom: 'var(1.5rem)',
            background: uploadStatus.type === 'success' ? 'var(--success-light)' : uploadStatus.type === 'error' ? 'var(--destructive-light)' : 'var(--card)',
            transition: 'all var(250ms ease-in-out)',
            boxShadow: uploadStatus.type === 'success' ? '0 0 0 3px var(--success-light)' : 'none'
          }}>
            {uploadStatus.type === 'success' ? (
              <div style={{ 
                color: 'var(--success)', 
                margin: '0 auto var(1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
            ) : uploadStatus.type === 'error' ? (
              <div style={{ 
                color: 'var(--destructive)', 
                margin: '0 auto var(1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
            ) : (
              <Upload 
                size={48} 
                style={{ 
                  color: 'var(--primary)', 
                  margin: '0 auto var(1rem)' 
                }} 
              />
            )}
            <p style={{ 
              color: uploadStatus.type === 'success' ? 'var(--success)' : uploadStatus.type === 'error' ? 'var(--destructive)' : 'var(--muted-foreground)', 
              marginBottom: 'var(1rem)',
              fontWeight: uploadStatus.type === 'success' ? '600' : 'normal'
            }}>
              {uploadStatus.type === 'success' ? '✅ File uploaded successfully!' : 
               uploadStatus.type === 'error' ? '❌ Upload failed' :
               selectedFile ? selectedFile.name : 'Click to select a file or drag and drop'}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <button 
                className="btn btn-secondary"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <FileText size={16} />
                Select File
              </button>
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{ 
              width: '100%',
              opacity: !selectedFile || uploading ? 0.5 : 1,
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Data'}
          </button>

          <div style={{ 
            marginTop: 'var(1.5rem)',
            padding: 'var(1rem)',
            background: 'var(--secondary-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)'
          }}>
            <strong>Supported format:</strong> CSV files with columns: date, medicine_name, 
            category, quantity, price, seasonal_demand
          </div>
        </ChartCard>

        {/* Export Section */}
        <ChartCard title="Export Data" subtitle="Download current database records">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(1rem)' 
          }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport('csv')}
              disabled={uploading}
              style={{ 
                justifyContent: 'center',
                opacity: uploading ? 0.5 : 1
              }}
            >
              <Download size={16} />
              Export as CSV
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => handleExport('json')}
              disabled={uploading}
              style={{ 
                justifyContent: 'center',
                opacity: uploading ? 0.5 : 1
              }}
            >
              <Download size={16} />
              Export as JSON
            </button>
          </div>
        </ChartCard>
      </div>

      {/* Database Management */}
      <div style={{ marginTop: 'var(2rem)' }}>
        <ChartCard 
          title="Database Management" 
          subtitle="Rebuild or reset the database"
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(1.5rem)' 
          }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: 'var(0.5rem)',
                color: 'var(--foreground)'
              }}>
                Rebuild Database
              </h4>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-foreground)',
                lineHeight: '1.6'
              }}>
                Rebuilds the entire database from source data. This will recalculate all 
                seasonal metrics and recommendations.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRebuildDatabase}
              disabled={uploading}
              style={{ opacity: uploading ? 0.5 : 1 }}
            >
              <RefreshCw size={16} />
              Rebuild
            </button>
          </div>

          <div style={{ 
            marginTop: 'var(1.5rem)',
            padding: 'var(1rem)',
            background: 'var(--accent-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            borderLeft: '3px solid var(--accent)'
          }}>
            <strong>Warning:</strong> Rebuilding the database may take several minutes. 
            Do not close this window during the process.
          </div>
        </ChartCard>
      </div>

      {/* Database Stats */}
      <div style={{ marginTop: 'var(2rem)' }}>
        <ChartCard title="Database Statistics" subtitle="Current database information">
          <div className="grid grid-cols-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: 'var(--primary)',
                marginBottom: 'var(0.5rem)'
              }}>
                55,234
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-foreground)' 
              }}>
                Total Records
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: 'var(--chart-5)',
                marginBottom: 'var(0.5rem)'
              }}>
                487
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-foreground)' 
              }}>
                Unique Medicines
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: 'var(--secondary)',
                marginBottom: 'var(0.5rem)'
              }}>
                24
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-foreground)' 
              }}>
                Categories
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: 'var(--accent)',
                marginBottom: 'var(0.5rem)'
              }}>
                3.2 MB
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-foreground)' 
              }}>
                Database Size
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DataUploadPage;

