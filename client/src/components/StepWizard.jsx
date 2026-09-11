import React from 'react';
import { UploadCloud, BarChart3, CheckCircle2 } from 'lucide-react';

export default function StepWizard({ currentStep, setStep, canAnalyze, canExport }) {
  const steps = [
    { id: 1, label: '1. Input CV & Job Description', icon: UploadCloud, enabled: true },
    { id: 2, label: '2. ATS Audit & Match Gaps', icon: BarChart3, enabled: canAnalyze },
    { id: 3, label: '3. Tailored ATS CV & Export', icon: CheckCircle2, enabled: canExport }
  ];

  return (
    <nav className="step-wizard" aria-label="Workflow Steps">
      <div className="step-wizard-inner">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;

          return (
            <div
              key={s.id}
              className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => {
                if (s.enabled) setStep(s.id);
              }}
              style={{ cursor: s.enabled ? 'pointer' : 'not-allowed', opacity: s.enabled ? 1 : 0.45 }}
            >
              <span className="step-num">{isCompleted ? '✓' : s.id}</span>
              <Icon size={16} />
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
