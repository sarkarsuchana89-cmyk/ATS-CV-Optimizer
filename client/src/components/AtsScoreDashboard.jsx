import React from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';

export default function AtsScoreDashboard({ analysis, optimizedAnalysis, isOptimized }) {
  const activeAnalysis = isOptimized && optimizedAnalysis ? optimizedAnalysis : analysis;
  if (!activeAnalysis) return null;

  const score = activeAnalysis.overallAtsScore || 0;
  const originalScore = analysis?.overallAtsScore || score;
  const scoreDelta = isOptimized && optimizedAnalysis ? optimizedAnalysis.overallAtsScore - originalScore : 0;

  // Calculate SVG stroke parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val) => {
    if (val >= 80) return '#10B981'; // Green
    if (val >= 60) return '#3B82F6'; // Blue
    if (val >= 40) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const scoreColor = getScoreColor(score);

  const getVerdict = (val) => {
    if (val >= 85) return { label: 'Excellent Match', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' };
    if (val >= 70) return { label: 'Strong Fit', bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' };
    if (val >= 50) return { label: 'Moderate Match', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' };
    return { label: 'Needs Optimization', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' };
  };

  const verdict = getVerdict(score);

  return (
    <div className="score-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Award size={20} style={{ color: scoreColor }} />
        <h3 style={{ fontSize: '1.1rem' }}>
          {isOptimized ? 'Tailored ATS Score' : 'Initial ATS Match'}
        </h3>
      </div>

      <div className="score-radial-wrapper">
        <svg className="score-circle-svg" viewBox="0 0 160 160">
          <circle
            className="score-circle-bg"
            cx="80"
            cy="80"
            r={radius}
          />
          <circle
            className="score-circle-progress"
            cx="80"
            cy="80"
            r={radius}
            stroke={scoreColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="score-radial-content">
          <div className="score-number" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="score-max">/ 100</div>
        </div>
      </div>

      <div 
        className="score-verdict-badge"
        style={{ background: verdict.bg, color: verdict.text }}
      >
        <ShieldCheck size={14} />
        <span>{verdict.label}</span>
      </div>

      {scoreDelta > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          background: 'rgba(16, 185, 129, 0.12)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399', 
          fontSize: '0.82rem', 
          fontWeight: 700, 
          padding: '0.35rem 0.85rem', 
          borderRadius: '9999px',
          marginBottom: '1.25rem' 
        }}>
          <TrendingUp size={15} />
          <span>+{scoreDelta} pts improvement from original CV</span>
        </div>
      )}

      {/* Sub-Metrics Progress Bars */}
      <div className="sub-metrics-list">
        <div className="metric-row">
          <div className="metric-header">
            <span>Keyword Coverage</span>
            <span style={{ color: getScoreColor(activeAnalysis.keywordMatchPercent) }}>
              {activeAnalysis.keywordMatchPercent}%
            </span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ 
                width: `${activeAnalysis.keywordMatchPercent}%`, 
                backgroundColor: getScoreColor(activeAnalysis.keywordMatchPercent) 
              }}
            />
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-header">
            <span>Experience & Role Alignment</span>
            <span style={{ color: getScoreColor(activeAnalysis.experienceScore) }}>
              {activeAnalysis.experienceScore}%
            </span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ 
                width: `${activeAnalysis.experienceScore}%`, 
                backgroundColor: getScoreColor(activeAnalysis.experienceScore) 
              }}
            />
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-header">
            <span>ATS Formatting Compliance</span>
            <span style={{ color: getScoreColor(activeAnalysis.formatScore) }}>
              {activeAnalysis.formatScore}%
            </span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ 
                width: `${activeAnalysis.formatScore}%`, 
                backgroundColor: getScoreColor(activeAnalysis.formatScore) 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
