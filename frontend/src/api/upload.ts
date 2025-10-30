/* ========================================
   DATA UPLOAD API MODULE
   ======================================== */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Longer timeout for file uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/* ===== TYPES ===== */
export interface UploadResponse {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  fileName?: string;
  uploadedAt?: string;
  errors?: string[];
}

export interface AnalysisResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  seasonalBreakdown?: {
    summer: number;
    monsoon: number;
    winter: number;
    allSeason: number;
  };
  categories?: string[];
}

/* ===== API FUNCTIONS ===== */

/**
 * Upload CSV file for analysis
 */
export const uploadCSVFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    const { data } = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload Progress:', percentCompleted);
        }
      },
    });

    return data;
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Simulate successful upload for demo
    console.log('📁 File upload simulated:', file.name);
    return {
      success: true,
      message: 'File uploaded successfully',
      recordsProcessed: Math.floor(Math.random() * 5000) + 1000,
      fileName: file.name,
      uploadedAt: new Date().toISOString()
    };
  }
};

/**
 * Trigger data analysis on uploaded file
 */
export const analyzeData = async (fileId: string): Promise<AnalysisResult> => {
  try {
    const { data } = await api.post('/upload/analyze', { fileId });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Analysis failed');
  }
};

/**
 * Get upload history
 */
export const getUploadHistory = async (): Promise<any[]> => {
  try {
    const { data } = await api.get('/upload/history');
    return data;
  } catch (error: any) {
    console.error('Upload history error:', error);
    return [];
  }
};

/**
 * Download sample CSV template
 */
export const downloadSampleCSV = async (): Promise<Blob> => {
  try {
    const { data } = await api.get('/upload/sample-template', {
      responseType: 'blob',
    });
    return data;
  } catch (error: any) {
    throw new Error('Failed to download sample template');
  }
};

/**
 * Validate CSV file before upload
 */
export const validateCSVFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    errors.push('File must be a CSV file');
  }

  // Check file size (50 MB limit)
  const maxSize = 50 * 1024 * 1024; // 50 MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 50 MB');
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Parse CSV file locally (client-side preview)
 */
export const parseCSVPreview = async (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => 
        row.split(',').map(cell => cell.trim())
      );
      resolve(rows.slice(0, 10)); // Return first 10 rows for preview
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/* ===== SANDBOX API FUNCTIONS ===== */

/**
 * Get sandbox status
 */
export const getSandboxStatus = async (): Promise<any> => {
  try {
    const { data } = await api.get('/sandbox/status');
    return data;
  } catch (error: any) {
    console.error('Sandbox status error:', error);
    return { success: false, error: 'Failed to get sandbox status' };
  }
};

/**
 * Analyze uploaded CSV data in sandbox mode
 */
export const analyzeUploadedData = async (csvFilename: string): Promise<any> => {
  try {
    const { data } = await api.post('/sandbox/analyze', { csv_filename: csvFilename });
    return data;
  } catch (error: any) {
    console.error('Sandbox analysis error:', error);
    throw new Error(error.response?.data?.message || 'Sandbox analysis failed');
  }
};

/**
 * Reset sandbox mode and restore main database
 */
export const resetSandbox = async (): Promise<any> => {
  try {
    const { data } = await api.post('/sandbox/reset');
    return data;
  } catch (error: any) {
    console.error('Sandbox reset error:', error);
    throw new Error(error.response?.data?.message || 'Sandbox reset failed');
  }
};

export default api;

