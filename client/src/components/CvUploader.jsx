import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, ChevronDown, ChevronUp, Edit3, Trash2, Sparkles } from 'lucide-react';

export default function CvUploader({ cvData, setCvData, onLoadSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setError('');
    setIsLoading(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse/cv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse CV file.');
      }

      setCvData(data.structured);
      setShowReview(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setCvData(null);
    setFileName('');
    setFileSize('');
    setError('');
    setShowReview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <FileText className="panel-icon" size={20} />
          <span>1. Your CV / Resume</span>
        </div>
        <button
          className="btn btn-outline"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          onClick={onLoadSample}
          title="Load pre-configured sample resume"
        >
          <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Load Sample</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: 'none' }}
      />

      {!cvData ? (
        <div
          className={`dropzone ${isDragging ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="dropzone-icon" />
          <div className="dropzone-title">
            {isLoading ? 'Extracting document text...' : 'Click or Drag & Drop your CV here'}
          </div>
          <div className="dropzone-sub">
            Supported formats: PDF, DOCX, DOC, TXT (Max 10MB)
          </div>
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <div className="spinner" />
            </div>
          )}
        </div>
      ) : (
        <div className="file-status-badge">
          <div className="file-info">
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <div>
              <div className="file-name">{fileName || cvData.contactInfo?.name || 'Resume Loaded'}</div>
              <div className="file-size">{fileSize || `${cvData.skills?.length || 0} skills parsed`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)' }}
              onClick={handleRemoveFile}
              title="Remove CV"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {cvData && (
        <div>
          <div 
            className="accordion-toggle"
            onClick={() => setShowReview(!showReview)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} />
              <span>Extracted CV Structure & Fields</span>
            </div>
            {showReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showReview && (
            <div className="accordion-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Candidate Name</label>
                  <input
                    type="text"
                    value={cvData.contactInfo?.name || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      contactInfo: { ...cvData.contactInfo, name: e.target.value }
                    })}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="text"
                    value={cvData.contactInfo?.email || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      contactInfo: { ...cvData.contactInfo, email: e.target.value }
                    })}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Summary</label>
                <textarea
                  value={cvData.summary || ''}
                  onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                  style={{ width: '100%', height: '60px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Parsed Skills ({cvData.skills?.length || 0}) — Comma-separated
                </label>
                <input
                  type="text"
                  value={(cvData.skills || []).join(', ')}
                  onChange={(e) => setCvData({
                    ...cvData,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {cvData.experience?.length || 0} Work Roles parsed • {cvData.education?.length || 0} Education items parsed
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
