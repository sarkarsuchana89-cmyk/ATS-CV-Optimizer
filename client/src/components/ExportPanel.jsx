import React, { useState } from 'react';
import { Download, FileText, Printer, Copy, Check, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerPrintPdf } from '../utils/exportPdf';

export default function ExportPanel({ tailoredCv }) {
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [downloadSuccessName, setDownloadSuccessName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!tailoredCv) return null;

  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      setDownloadSuccessName('');

      // 1. Ask server to prepare the file and provide a direct native URL
      const response = await fetch('/api/export/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: tailoredCv })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare document for download.');
      }

      const data = await response.json();
      if (!data.downloadUrl) {
        throw new Error('Server did not return a valid download link.');
      }

      // 2. Trigger top-level native download via window.location.href
      window.location.href = data.downloadUrl;
      setDownloadSuccessName(data.filename || 'Resume.docx');

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to direct window location if needed
      const rawName = tailoredCv.contactInfo?.name || 'Candidate';
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Candidate';
      alert('Error initiating download: ' + err.message);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handlePrintPdf = () => {
    triggerPrintPdf(tailoredCv.contactInfo?.name || 'Candidate');
  };

  const handleCopyText = () => {
    const lines = [];
    const contact = tailoredCv.contactInfo || {};

    lines.push(contact.name || 'Candidate Name');
    if (contact.title) lines.push(contact.title);
    
    const contactRow = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).join(' | ');
    if (contactRow) lines.push(contactRow);
    lines.push('');

    if (tailoredCv.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push(tailoredCv.summary);
      lines.push('');
    }

    if (tailoredCv.skills && tailoredCv.skills.length > 0) {
      lines.push('TECHNICAL SKILLS');
      lines.push(tailoredCv.skills.join(', '));
      lines.push('');
    }

    if (tailoredCv.experience && tailoredCv.experience.length > 0) {
      lines.push('PROFESSIONAL EXPERIENCE');
      for (const job of tailoredCv.experience) {
        lines.push(`${job.role} - ${job.company} (${job.dates})`);
        for (const bullet of job.bullets || []) {
          lines.push(`• ${bullet}`);
        }
        lines.push('');
      }
    }

    if (tailoredCv.education && tailoredCv.education.length > 0) {
      lines.push('EDUCATION');
      for (const edu of tailoredCv.education) {
        lines.push(`${edu.degree} - ${edu.institution} (${edu.dates})`);
      }
      lines.push('');
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Export ATS Optimized Resume</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Download as machine-readable Word (.docx) or PDF with standard ATS typography and single-column layout.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
          >
            {isDownloadingDocx ? <div className="spinner" /> : <Download size={16} />}
            <span>Download Word (.docx)</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handlePrintPdf}
          >
            <Printer size={16} />
            <span>Save as PDF</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={handleCopyText}
          >
            {copied ? <Check size={16} style={{ color: '#34d399' }} /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
          </button>
        </div>
      </div>

      {downloadSuccessName && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: '#34d399'
        }}>
          <CheckCircle2 size={16} />
          <span>
            Successfully generated <strong>{downloadSuccessName}</strong>! Check your computer's <strong>Downloads</strong> folder.
          </span>
        </div>
      )}
    </div>
  );
}
