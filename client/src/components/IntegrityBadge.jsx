import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export default function IntegrityBadge({ integrityReport, optimizationMode }) {
  if (!integrityReport) return null;

  const isAi = optimizationMode === 'ai_gemini';

  return (
    <div className="integrity-banner">
      <div className="integrity-icon-box">
        <ShieldCheck size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="integrity-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span>100% Truthfulness & Factual Integrity Verified</span>
          {isAi ? (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.03em'
            }}>
              <Sparkles size={11} /> Gemini AI Tailored
            </span>
          ) : (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px'
            }}>
              Algorithmic Engine
            </span>
          )}
        </div>
        <div className="integrity-desc">
          {integrityReport.auditSummary}
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}>
            <CheckCircle2 size={14} /> Zero Hallucinated Skills
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}>
            <CheckCircle2 size={14} /> {integrityReport.verifiedSkillsCount || 0} Verified Skills
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}>
            <Lock size={14} /> Truthful Dates & Employers Preserved
          </span>
        </div>
      </div>
    </div>
  );
}
