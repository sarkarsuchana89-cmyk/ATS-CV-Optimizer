import React, { useState } from 'react';
import { Eye, FileCode2, Sparkles, Edit3, Check, MapPin, Mail, Phone, Linkedin, Github } from 'lucide-react';

export default function ResumePreview({ originalCv, tailoredCv, onUpdateTailoredCv }) {
  const [viewMode, setViewMode] = useState('tailored'); // 'tailored' | 'original' | 'diff'
  const [isEditing, setIsEditing] = useState(false);

  const currentCv = viewMode === 'original' ? originalCv : tailoredCv;
  if (!currentCv) return null;

  const contact = currentCv.contactInfo || {};

  return (
    <div className="preview-container">
      <div className="preview-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Document View:</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${viewMode === 'tailored' ? 'active' : ''}`}
              onClick={() => setViewMode('tailored')}
            >
              <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Tailored ATS CV
            </button>
            <button
              className={`toggle-btn ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
            >
              <FileCode2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Diff Highlights
            </button>
            <button
              className={`toggle-btn ${viewMode === 'original' ? 'active' : ''}`}
              onClick={() => setViewMode('original')}
            >
              <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Original CV
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check size={14} />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 size={14} />
                <span>Live Inline Edit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ATS Sheet Paper */}
      <div className="resume-paper" id="printable-resume">
        {/* Contact Header */}
        <header className="resume-header">
          {isEditing ? (
            <input
              type="text"
              value={contact.name || ''}
              onChange={(e) => onUpdateTailoredCv({
                ...currentCv,
                contactInfo: { ...contact, name: e.target.value }
              })}
              style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', width: '100%', border: '1px dashed #cbd5e1', padding: '4px' }}
            />
          ) : (
            <h1 className="resume-name">{contact.name || 'Candidate Name'}</h1>
          )}

          {isEditing ? (
            <input
              type="text"
              value={contact.title || ''}
              onChange={(e) => onUpdateTailoredCv({
                ...currentCv,
                contactInfo: { ...contact, title: e.target.value }
              })}
              placeholder="Professional Title"
              style={{ fontSize: '1rem', fontWeight: 600, color: '#2b6cb0', textAlign: 'center', width: '100%', border: '1px dashed #cbd5e1', padding: '4px', margin: '4px 0' }}
            />
          ) : (
            contact.title && <div className="resume-title">{contact.title}</div>
          )}

          <div className="resume-contact-line">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>• {contact.phone}</span>}
            {contact.location && <span>• {contact.location}</span>}
            {contact.linkedin && <span>• {contact.linkedin}</span>}
            {contact.github && <span>• {contact.github}</span>}
          </div>
        </header>

        {/* Summary Section */}
        {(currentCv.summary || isEditing) && (
          <section className="resume-section">
            <h2 className="resume-section-title">Professional Summary</h2>
            {isEditing ? (
              <textarea
                value={currentCv.summary || ''}
                onChange={(e) => onUpdateTailoredCv({ ...currentCv, summary: e.target.value })}
                style={{ width: '100%', minHeight: '80px', border: '1px dashed #cbd5e1', padding: '8px', fontSize: '10pt', fontFamily: 'inherit' }}
              />
            ) : (
              <p className="resume-summary-text">{currentCv.summary}</p>
            )}
          </section>
        )}

        {/* Skills Section */}
        {currentCv.skills && currentCv.skills.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Technical & Core Competencies</h2>
            {isEditing ? (
              <input
                type="text"
                value={(currentCv.skills || []).join(', ')}
                onChange={(e) => onUpdateTailoredCv({
                  ...currentCv,
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                style={{ width: '100%', border: '1px dashed #cbd5e1', padding: '6px', fontSize: '10pt' }}
              />
            ) : (
              <div className="resume-skills-grid">
                {currentCv.skills.join('  •  ')}
              </div>
            )}
          </section>
        )}

        {/* Work Experience Section */}
        {currentCv.experience && currentCv.experience.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Professional Experience</h2>
            {currentCv.experience.map((job, jIdx) => (
              <div key={jIdx} className="resume-job-entry">
                <div className="resume-job-header">
                  <div className="resume-role-company">
                    {job.role} {job.company ? `— ${job.company}` : ''} {job.location ? `(${job.location})` : ''}
                  </div>
                  {job.dates && <div className="resume-role-dates">{job.dates}</div>}
                </div>

                <ul className="resume-bullets-list">
                  {(job.bullets || []).map((bullet, bIdx) => (
                    <li key={bIdx} className="resume-bullet-item">
                      {bullet}
                      {viewMode === 'diff' && (
                        <span className="bullet-optimized-tag">ATS Optimized</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Projects Section */}
        {currentCv.projects && currentCv.projects.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Key Projects</h2>
            {currentCv.projects.map((proj, pIdx) => (
              <div key={pIdx} className="resume-job-entry">
                <div className="resume-job-header">
                  <div className="resume-role-company">
                    {proj.name} {proj.techStack ? `(${proj.techStack})` : ''}
                  </div>
                </div>
                <ul className="resume-bullets-list">
                  {(proj.bullets || []).map((bullet, bIdx) => (
                    <li key={bIdx} className="resume-bullet-item">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education Section */}
        {currentCv.education && currentCv.education.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Education</h2>
            {currentCv.education.map((edu, eIdx) => (
              <div key={eIdx} style={{ marginBottom: '0.6rem' }}>
                <div className="resume-job-header">
                  <div className="resume-role-company">
                    {edu.degree} {edu.institution ? `— ${edu.institution}` : ''}
                  </div>
                  {edu.dates && <div className="resume-role-dates">{edu.dates}</div>}
                </div>
                {edu.details && edu.details.length > 0 && (
                  <ul className="resume-bullets-list">
                    {edu.details.map((d, dIdx) => (
                      <li key={dIdx} className="resume-bullet-item">{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Certifications Section */}
        {currentCv.certifications && currentCv.certifications.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Certifications & Credentials</h2>
            <ul className="resume-bullets-list">
              {currentCv.certifications.map((cert, cIdx) => (
                <li key={cIdx} className="resume-bullet-item">{cert}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
