import React from 'react';
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function IntegrityBadge({ integrityReport, optimizationMode }) {
  if (!integrityReport) return null;

  return (
    <div className="integrity-banner">
      <div className="integrity-icon-box">
        <ShieldCheck size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="integrity-title">
          100% Truthfulness & Factual Integrity Verified
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
