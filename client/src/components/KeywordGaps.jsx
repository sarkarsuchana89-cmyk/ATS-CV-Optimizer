import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Tag } from 'lucide-react';

export default function KeywordGaps({ analysis }) {
  const [activeTab, setActiveTab] = useState('matched');

  if (!analysis) return null;

  const matchedCount = analysis.matchedSkills?.length || 0;
  const missingCount = analysis.missingSkills?.length || 0;
  const underrepresentedCount = analysis.underrepresentedSkills?.length || 0;
  const recsCount = analysis.recommendations?.length || 0;

  return (
    <div className="analysis-panel">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'matched' ? 'active' : ''}`}
          onClick={() => setActiveTab('matched')}
        >
          <CheckCircle2 size={16} style={{ color: '#34d399' }} />
          <span>Matched Keywords</span>
          <span className="badge-count" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            {matchedCount}
          </span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          <XCircle size={16} style={{ color: '#f87171' }} />
          <span>Target Gaps</span>
          <span className="badge-count" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
            {missingCount}
          </span>
        </button>

        {underrepresentedCount > 0 && (
          <button
            className={`tab-btn ${activeTab === 'underrepresented' ? 'active' : ''}`}
            onClick={() => setActiveTab('underrepresented')}
          >
            <AlertCircle size={16} style={{ color: '#38bdf8' }} />
            <span>Hidden Strengths</span>
            <span className="badge-count" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
              {underrepresentedCount}
            </span>
          </button>
        )}

        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Lightbulb size={16} style={{ color: '#fbbf24' }} />
          <span>ATS Recommendations</span>
          <span className="badge-count" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
            {recsCount}
          </span>
        </button>
      </div>

      {/* Tab: Matched Keywords */}
      {activeTab === 'matched' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            These keywords from the job description are verified in your background and prioritized in your tailored ATS CV.
          </p>

          {Object.entries(analysis.categorizedMatched || {}).length > 0 ? (
            Object.entries(analysis.categorizedMatched).map(([category, skills]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {category}
                </div>
                <div className="chips-cloud">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="skill-chip matched">
                      <CheckCircle2 size={13} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="chips-cloud">
              {analysis.matchedSkills.map((s, idx) => (
                <span key={idx} className="skill-chip matched">
                  <CheckCircle2 size={13} />
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Missing Gaps */}
      {activeTab === 'missing' && (
        <div>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: '8px', 
            padding: '0.75rem 1rem', 
            marginBottom: '1rem',
            fontSize: '0.83rem',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: '#f87171' }}>Strict Truthfulness Policy:</strong> These keywords appear in the JD but are missing from your CV. We strictly <em>do not</em> fabricate these skills. Instead, we highlight your verified core strengths and related transferable experience.
          </div>

          {Object.entries(analysis.categorizedMissing || {}).length > 0 ? (
            Object.entries(analysis.categorizedMissing).map(([category, skills]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {category}
                </div>
                <div className="chips-cloud">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="skill-chip missing">
                      <XCircle size={13} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="chips-cloud">
              {analysis.missingSkills.map((s, idx) => (
                <span key={idx} className="skill-chip missing">
                  <XCircle size={13} />
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Underrepresented */}
      {activeTab === 'underrepresented' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            These skills were detected in your experience or project descriptions but weren't emphasized in your main skills list. Our optimizer promoted them directly to your tailored profile:
          </p>
          <div className="chips-cloud">
            {analysis.underrepresentedSkills.map((skill, idx) => (
              <span key={idx} className="skill-chip underrepresented">
                <Tag size={13} />
                {skill} (Promoted)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Recommendations */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(analysis.recommendations || []).map((rec, idx) => (
            <div 
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem 1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rec.title}</strong>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  padding: '0.15rem 0.45rem', 
                  borderRadius: '4px',
                  background: rec.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: rec.priority === 'High' ? '#f87171' : '#60a5fa'
                }}>
                  {rec.priority} Priority
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
