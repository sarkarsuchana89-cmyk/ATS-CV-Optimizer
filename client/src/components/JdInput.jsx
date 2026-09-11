import React, { useRef } from 'react';
import { Briefcase, UploadCloud, Sparkles, FileText, Trash2 } from 'lucide-react';
import { SAMPLE_PROFILES } from '../utils/sampleData';

export default function JdInput({ jdText, setJdText, onSelectPreset }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse/jd', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.text) {
        setJdText(data.text);
      }
    } catch (err) {
      console.error('Failed to parse JD file:', err);
    }
  };

  const wordCount = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Briefcase className="panel-icon" size={20} />
          <span>2. Target Job Description</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            onClick={() => fileInputRef.current?.click()}
            title="Upload JD Document"
          >
            <UploadCloud size={14} />
            <span>Upload JD File</span>
          </button>
          {jdText && (
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.5rem', color: 'var(--text-muted)' }}
              onClick={() => setJdText('')}
              title="Clear text"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="presets-bar">
        <span className="preset-label">Presets:</span>
        {SAMPLE_PROFILES.map((profile) => (
          <button
            key={profile.id}
            className="preset-chip"
            onClick={() => onSelectPreset(profile)}
          >
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            {profile.label}
          </button>
        ))}
      </div>

      <textarea
        className="jd-textarea"
        placeholder="Paste the complete job description here, including responsibilities, required skills, and qualifications..."
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {wordCount} words • {jdText.length} characters
        </span>
        {wordCount > 0 && wordCount < 50 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--warning)' }}>
            ⚠️ Add more details from the JD for better ATS scoring.
          </span>
        )}
      </div>
    </div>
  );
}
