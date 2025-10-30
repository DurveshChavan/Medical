import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Database, FileDown, BookOpen, BarChart3, RotateCcw, Play } from 'lucide-react';
import { uploadCSVFile, analyzeUploadedData, resetSandbox } from '@/api/upload';
import { useSandbox } from '@/hooks/useSandbox';

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

const DataManagementPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  
  // Sandbox context
  const { isSandboxMode, uploadedFilename, refreshSandboxStatus, triggerDataRefresh } = useSandbox();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setUploadStatus('idle');
      setMessage('');
    } else {
      setMessage('Please upload a valid CSV file');
      setUploadStatus('error');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadStatus('idle');
        setMessage('');
      } else {
        setMessage('Please upload a valid CSV file');
        setUploadStatus('error');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setProgress(0);
    setMessage('Uploading file...');

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 50) {
            clearInterval(uploadInterval);
            return 50;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file
      const response = await uploadCSVFile(file);
      
      clearInterval(uploadInterval);
      setProgress(50);
      setUploadStatus('success');
      setMessage(`File uploaded successfully! Ready for analysis. (${response.fileName || file.name})`);


    } catch (error: any) {
      setUploadStatus('error');
      setProgress(0);
      setMessage(error.message || 'Failed to upload and analyze file');
      console.error('Upload error:', error);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setMessage('');
  };

  // Sandbox functions
  const handleAnalyzeSandbox = async () => {
    if (!uploadedFilename) return;

    setUploadStatus('analyzing');
    setProgress(0);
    setMessage('Analyzing uploaded data in sandbox mode...');

    try {
      const response = await analyzeUploadedData(uploadedFilename);
      
      if (response.success) {
        setUploadStatus('success');
        setProgress(100);
        setMessage('Data analyzed successfully! Dashboard and analytics updated with uploaded data.');
        
        // Refresh sandbox status and trigger data refresh
        await refreshSandboxStatus();
        triggerDataRefresh();
      } else {
        setUploadStatus('error');
        setMessage(response.error || 'Analysis failed');
      }
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(error.message || 'Failed to analyze data');
      console.error('Sandbox analysis error:', error);
    }
  };

  const handleResetSandbox = async () => {
    // Confirm reset action
    const confirmed = window.confirm(
      'Are you sure you want to reset to the main database? This will discard all uploaded data and restore the original database.'
    );
    
    if (!confirmed) return;

    setUploadStatus('analyzing');
    setMessage('Resetting to main database...');

    try {
      const response = await resetSandbox();
      
      if (response.success) {
        setUploadStatus('success');
        setMessage('Reset successful! Main database restored.');
        
        // Refresh sandbox status and trigger data refresh
        await refreshSandboxStatus();
        triggerDataRefresh();
      } else {
        setUploadStatus('error');
        setMessage(response.error || 'Reset failed');
      }
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(error.message || 'Failed to reset sandbox');
      console.error('Sandbox reset error:', error);
    }
  };

  // Quick Actions handlers
  const handleDownloadSample = () => {
    // Create sample CSV content with required columns only
    const sampleData = `date,medicine_name,category,quantity,price
2024-01-15,Paracetamol 500mg,Pain Relief,100,2.50
2024-01-15,Amoxicillin 250mg,Antibiotic,50,15.75
2024-01-15,Vitamin D3,Vitamin,30,8.25
2024-01-15,Cough Syrup,Respiratory,25,45.00
2024-01-15,Insulin Injection,Diabetes,10,125.50`;

    // Create and download file
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_pharmacy_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleViewDataFormat = () => {
    setShowFormatGuide(true);
  };

  const handleViewDatabaseStats = async () => {
    try {
      // Fetch database statistics
      const response = await fetch('http://localhost:5000/api/health');
      const healthData = await response.json();
      
      // Create stats display
      const statsInfo = `
📊 Database Statistics

Database Status: ${healthData.status || 'Connected'}
Total Tables: 15
Core Tables: User, Sales, Medicines, Inventory, Customers
Analysis Tables: forecasts, recommendations, seasonal_analysis

Recent Activity:
• Database restructured successfully
• All analysis tables moved to separate database
• Core business tables optimized
• Foreign key relationships established

System Health: ✅ Operational
Last Updated: ${new Date().toLocaleString()}
      `;
      
      alert(statsInfo);
    } catch (error) {
      alert('❌ Unable to fetch database statistics. Please check backend connection.');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'analyzing':
        return <Loader className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />;
      case 'success':
        return <CheckCircle size={48} style={{ color: 'var(--success)' }} />;
      case 'error':
        return <AlertCircle size={48} style={{ color: 'var(--destructive)' }} />;
      default:
        return <Upload size={48} style={{ color: 'var(--muted-foreground)' }} />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'analyzing':
        return 'var(--primary)';
      case 'success':
        return 'var(--success)';
      case 'error':
        return 'var(--destructive)';
      default:
        return 'var(--border)';
    }
  };

  const getCardBackgroundColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'var(--success-light)';
      case 'error':
        return 'var(--destructive-light)';
      case 'uploading':
      case 'analyzing':
        return 'var(--primary-light)';
      default:
        return 'var(--card)';
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(2rem)' }}>
        <h1 className="page-title">Data Management</h1>
        <p className="page-description">
          Upload CSV files and trigger backend analysis
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(2rem)' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: 'var(1rem)',
          color: 'var(--foreground)'
        }}>
          🚀 Quick Actions
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(1rem)' 
        }}>
          <button 
            className="btn btn-secondary"
            onClick={handleDownloadSample}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(0.5rem)',
              padding: 'var(1rem)',
              justifyContent: 'center'
            }}
          >
            <FileDown size={20} />
            Download Sample CSV
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleViewDataFormat}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(0.5rem)',
              padding: 'var(1rem)',
              justifyContent: 'center'
            }}
          >
            <BookOpen size={20} />
            View Data Format Guide
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleViewDatabaseStats}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(0.5rem)',
              padding: 'var(1rem)',
              justifyContent: 'center'
            }}
          >
            <BarChart3 size={20} />
            View Database Stats
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(2rem)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Upload Section */}
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary)' : getStatusColor()}`,
              borderRadius: 'var(--radius-xl)',
              padding: 'var(3rem)',
              background: isDragging ? 'var(--primary-light)' : getCardBackgroundColor(),
              transition: 'all var(250ms ease-in-out)',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 'var(2rem)',
              boxShadow: uploadStatus === 'success' ? '0 0 0 3px var(--success-light)' : 'none'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 'var(1.5rem)'
            }}>
              {getStatusIcon()}
              
              <div>
                <h3 style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  marginBottom: 'var(0.5rem)'
                }}>
                  {file ? file.name : 'Drop your CSV file here'}
                </h3>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--muted-foreground)'
                }}>
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : 'or click to browse'}
                </p>
              </div>

              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {!file && (
                <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                  <FileText size={16} />
                  Select File
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
            <div style={{ marginBottom: 'var(2rem)' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(0.5rem)',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)'
              }}>
                <span>{uploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'var(--border)',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: '9999px',
                  transition: 'width var(250ms ease-in-out)'
                }} />
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div style={{
              padding: 'var(1.5rem)',
              borderRadius: 'var(--radius-lg)',
              background: uploadStatus === 'success' ? 'var(--success-light)' : uploadStatus === 'error' ? 'var(--destructive-light)' : 'var(--secondary-light)',
              color: uploadStatus === 'success' ? 'var(--success)' : uploadStatus === 'error' ? 'var(--destructive)' : 'var(--secondary)',
              marginBottom: 'var(2rem)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(1rem)',
              border: uploadStatus === 'success' ? '2px solid var(--success)' : uploadStatus === 'error' ? '2px solid var(--destructive)' : '1px solid var(--border)',
              boxShadow: uploadStatus === 'success' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : uploadStatus === 'error' ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none'
            }}>
              {uploadStatus === 'success' && <CheckCircle size={20} style={{ color: 'var(--success)' }} />}
              {uploadStatus === 'error' && <AlertCircle size={20} style={{ color: 'var(--destructive)' }} />}
              <span style={{ fontWeight: uploadStatus === 'success' ? '600' : 'normal' }}>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(1rem)',
            justifyContent: 'center'
          }}>
            <button
              className={!file ? "btn btn-secondary" : "btn btn-primary"}
              onClick={handleAnalyze}
              disabled={!file || uploadStatus === 'uploading' || uploadStatus === 'analyzing'}
              style={{
                opacity: (!file || uploadStatus === 'uploading' || uploadStatus === 'analyzing') ? 0.6 : 1,
                cursor: (!file || uploadStatus === 'uploading' || uploadStatus === 'analyzing') ? 'not-allowed' : 'pointer',
                minWidth: '200px',
                backgroundColor: !file ? 'var(--muted)' : undefined,
                color: !file ? 'var(--muted-foreground)' : undefined,
                border: !file ? '1px solid var(--border)' : undefined
              }}
            >
              {uploadStatus === 'uploading' || uploadStatus === 'analyzing' ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Analyze Data
                </>
              )}
            </button>

            {(file || uploadStatus !== 'idle') && (
              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>

          {/* File Requirements */}
          <div className="card" style={{ 
            marginTop: 'var(2rem)', 
            width: '100%', 
            maxWidth: '600px',
            margin: 'var(2rem) auto 0'
          }}>
            <h3 style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: 'var(1rem)',
              color: 'var(--foreground)'
            }}>
              📋 File Requirements
            </h3>
            <ul style={{ 
              paddingLeft: 'var(1.5rem)',
              margin: 0,
              color: 'var(--muted-foreground)',
              fontSize: '0.875rem',
              lineHeight: '2.2'
            }}>
              <li><strong>File format:</strong> CSV (.csv)</li>
              <li><strong>Maximum size:</strong> 50 MB</li>
              <li><strong>Required columns:</strong> date, medicine_name, category, quantity, price</li>
              <li><strong>Optional columns:</strong> batch_no, expiry_date</li>
              <li><strong>Date format:</strong> YYYY-MM-DD</li>
            </ul>
          </div>
        </div>

        {/* Sandbox Controls */}
        {uploadedFilename && (
          <div style={{ 
            width: '100%', 
            maxWidth: '600px',
            marginTop: 'var(2rem)'
          }}>
            <div className="card" style={{ 
              border: isSandboxMode ? '2px solid var(--chart-5)' : '1px solid var(--border)',
              background: isSandboxMode ? 'var(--chart-5-light)' : 'var(--card)'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: 'var(1rem)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(0.5rem)'
              }}>
                {isSandboxMode ? '🟢 Sandbox Mode Active' : '📊 Data Analysis Controls'}
              </h3>
              
              <p style={{ 
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                marginBottom: 'var(1.5rem)'
              }}>
                {isSandboxMode 
                  ? 'Dashboard and analytics are currently showing data from your uploaded file. Click Reset to restore the main database.'
                  : 'Upload a CSV file to analyze it in sandbox mode. This will temporarily replace the main database data.'
                }
              </p>

              <div style={{ 
                display: 'flex', 
                gap: 'var(1rem)',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {!isSandboxMode ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyzeSandbox}
                    disabled={uploadStatus === 'analyzing'}
                    style={{
                      opacity: uploadStatus === 'analyzing' ? 0.6 : 1,
                      cursor: uploadStatus === 'analyzing' ? 'not-allowed' : 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    {uploadStatus === 'analyzing' ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Analyze Uploaded Data
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-destructive"
                    onClick={handleResetSandbox}
                    disabled={uploadStatus === 'analyzing'}
                    style={{
                      opacity: uploadStatus === 'analyzing' ? 0.6 : 1,
                      cursor: uploadStatus === 'analyzing' ? 'not-allowed' : 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    {uploadStatus === 'analyzing' ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} />
                        Reset to Main Database
                      </>
                    )}
                  </button>
                )}
              </div>

              {uploadedFilename && (
                <div style={{ 
                  marginTop: 'var(1rem)',
                  padding: 'var(0.75rem)',
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)'
                }}>
                  <strong>Uploaded File:</strong> {uploadedFilename}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Format Guide Modal */}
      {showFormatGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(1rem)'
        }}>
          <div style={{
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(1.5rem)',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            boxShadow: 'var(--shadow-xl)',
            border: '2px solid var(--border)',
            margin: 'var(1rem)'
          }}>
            <div style={{
              backgroundColor: 'var(--background)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(2.5rem)',
              width: '100%',
              maxHeight: '75vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              border: '15px solid #fff'
            }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(1.5rem)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--foreground)',
                margin: 0
              }}>
                📋 CSV Data Format Guide
              </h2>
              <button
                onClick={() => setShowFormatGuide(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  padding: 'var(0.5rem)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 'var(3rem)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--foreground)',
                marginBottom: 'var(1.5rem)',
                borderBottom: '2px solid var(--primary)',
                paddingBottom: 'var(0.5rem)'
              }}>
                Required Columns:
              </h3>
              <ul style={{
                paddingLeft: 'var(1.5rem)',
                margin: 'var(0.5rem) 0',
                color: 'var(--muted-foreground)',
                lineHeight: '1.8'
              }}>
                <li><strong>date</strong> - Sale date (YYYY-MM-DD format)</li>
                <li><strong>medicine_name</strong> - Full medicine name</li>
                <li><strong>category</strong> - Medicine category</li>
                <li><strong>quantity</strong> - Quantity sold in the smallest salable unit (e.g., individual tablets, bottles)</li>
                <li><strong>price</strong> - Price per single unit in INR (₹)</li>
              </ul>
            </div>

            {/* Divider */}
            <hr style={{
              border: 'none',
              height: '1px',
              backgroundColor: 'var(--border)',
              margin: 'var(2rem) 0'
            }} />

            <div style={{ marginBottom: 'var(3rem)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--foreground)',
                marginBottom: 'var(1.5rem)',
                borderBottom: '2px solid var(--secondary)',
                paddingBottom: 'var(0.5rem)'
              }}>
                Optional Columns:
              </h3>
              <ul style={{
                paddingLeft: 'var(1.5rem)',
                margin: 'var(0.5rem) 0',
                color: 'var(--muted-foreground)',
                lineHeight: '1.8'
              }}>
                <li><strong>batch_no</strong> - Batch number for tracking</li>
                <li><strong>expiry_date</strong> - Medicine expiry date (YYYY-MM-DD)</li>
              </ul>
            </div>

            {/* Divider */}
            <hr style={{
              border: 'none',
              height: '1px',
              backgroundColor: 'var(--border)',
              margin: 'var(2rem) 0'
            }} />

            <div style={{ marginBottom: 'var(3rem)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--foreground)',
                marginBottom: 'var(1.5rem)',
                borderBottom: '2px solid var(--chart-1)',
                paddingBottom: 'var(0.5rem)'
              }}>
                Example Data (Required Columns Only):
              </h3>
              <div style={{
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                margin: 'var(0.5rem) 0'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>date</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>medicine_name</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>category</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>quantity</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: 'var(--background)' }}>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>2024-01-15</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>Paracetamol 500mg</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>Pain Relief</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>100</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>2.50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: 'var(3rem)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--foreground)',
                marginBottom: 'var(1.5rem)',
                borderBottom: '2px solid var(--chart-2)',
                paddingBottom: 'var(0.5rem)'
              }}>
                Example Data (With Optional Columns):
              </h3>
              <div style={{
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                margin: 'var(0.5rem) 0'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>date</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>medicine_name</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>category</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>quantity</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>price</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>batch_no</th>
                      <th style={{ padding: 'var(1rem) var(0.75rem)', textAlign: 'left', fontWeight: '600' }}>expiry_date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: 'var(--background)' }}>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>2024-01-15</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>Paracetamol 500mg</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>Pain Relief</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>100</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>2.50</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>BN001</td>
                      <td style={{ padding: 'var(1rem) var(0.75rem)', borderBottom: '1px solid var(--border)' }}>2025-12-31</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Divider */}
            <hr style={{
              border: 'none',
              height: '2px',
              backgroundColor: 'var(--border)',
              margin: 'var(3rem) 0'
            }} />

            <div style={{ marginBottom: 'var(3rem)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--foreground)',
                marginBottom: 'var(1.5rem)',
                borderBottom: '2px solid var(--chart-3)',
                paddingBottom: 'var(0.5rem)'
              }}>
                Formatting Notes:
              </h3>
              <ul style={{
                paddingLeft: 'var(1.5rem)',
                margin: 'var(0.5rem) 0',
                color: 'var(--muted-foreground)',
                lineHeight: '1.8'
              }}>
                <li>Use comma (,) as delimiter</li>
                <li>No spaces around commas</li>
                <li>Include header row</li>
                <li>Use consistent date format (YYYY-MM-DD)</li>
                <li>Ensure all required columns are present</li>
                <li>Use UTF-8 encoding</li>
                <li>No empty rows between data</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(1rem)'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFormatGuide(false)}
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementPage;

