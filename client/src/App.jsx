import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

import Header from './components/Header';
import StepWizard from './components/StepWizard';
import CvUploader from './components/CvUploader';
import JdInput from './components/JdInput';
import AtsScoreDashboard from './components/AtsScoreDashboard';
import KeywordGaps from './components/KeywordGaps';
import ResumePreview from './components/ResumePreview';
import IntegrityBadge from './components/IntegrityBadge';
import ExportPanel from './components/ExportPanel';
import SettingsModal from './components/SettingsModal';

import { SAMPLE_PROFILES } from './utils/sampleData';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // State
  const [cvData, setCvData] = useState(null);
  const [jdText, setJdText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [tailoredCv, setTailoredCv] = useState(null);
  const [optimizedAnalysis, setOptimizedAnalysis] = useState(null);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [diffSummary, setDiffSummary] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState('algorithmic');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load sample profile
  const handleLoadSample = (profile = SAMPLE_PROFILES[0]) => {
    setCvData(profile.cv);
    setJdText(profile.jd);
    setAnalysis(null);
    setTailoredCv(null);
    setOptimizedAnalysis(null);
    setErrorMessage('');
  };

  // Reset entire application
  const handleReset = () => {
    setCvData(null);
    setJdText('');
    setAnalysis(null);
    setTailoredCv(null);
    setOptimizedAnalysis(null);
    setIntegrityReport(null);
    setDiffSummary(null);
    setCurrentStep(1);
    setErrorMessage('');
  };

  // Step 1 -> Step 2 & 3: Run ATS Analysis & Tailor CV
  const handleProcessAll = async () => {
    if (!cvData) {
      setErrorMessage('Please upload or load your CV first.');
      return;
    }
    if (!jdText.trim()) {
      setErrorMessage('Please enter or upload a Job Description.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      // 1. Run ATS Analysis
      setLoadingText('Analyzing CV against Job Description & extracting keywords...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jdText })
      });

      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson.error || 'Analysis failed');

      setAnalysis(analyzeJson.analysis);

      // 2. Run Truthful Optimization
      setLoadingText('Optimizing CV bullet points & verifying factual integrity...');
      const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      const optRes = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jdText,
          atsAnalysis: analyzeJson.analysis,
          apiKey
        })
      });

      const optJson = await optRes.json();
      if (!optRes.ok) throw new Error(optJson.error || 'Optimization failed');

      setTailoredCv(optJson.tailoredCv);
      setOptimizedAnalysis(optJson.optimizedAnalysis);
      setIntegrityReport(optJson.integrityReport);
      setDiffSummary(optJson.diffSummary);
      setOptimizationMode(optJson.optimizationMode);

      setCurrentStep(3); // Advance to tailored resume view

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during processing.');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  return (
    <div className="app-container">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        hasData={Boolean(cvData || jdText)}
      />

      <StepWizard
        currentStep={currentStep}
        setStep={setCurrentStep}
        canAnalyze={Boolean(analysis || (cvData && jdText))}
        canExport={Boolean(tailoredCv)}
      />

      {/* Main Hero Header */}
      {currentStep === 1 && (
        <div className="hero-banner">
          <h1>Optimize Your CV for Applicant Tracking Systems</h1>
          <p>
            Match your true qualifications against any job description. Enhance bullet points, highlight relevant skills, and pass ATS filters — with zero hallucinated or false experience.
          </p>
        </div>
      )}

      {errorMessage && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 1.5rem auto',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#f87171',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Input CV & JD */}
      {currentStep === 1 && (
        <div>
          <div className="input-grid">
            <CvUploader
              cvData={cvData}
              setCvData={setCvData}
              onLoadSample={() => handleLoadSample(SAMPLE_PROFILES[0])}
            />

            <JdInput
              jdText={jdText}
              setJdText={setJdText}
              onSelectPreset={(profile) => handleLoadSample(profile)}
            />
          </div>

          <div className="action-trigger-area">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleProcessAll}
              disabled={isLoading || !cvData || !jdText.trim()}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>{loadingText || 'Analyzing & Optimizing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Analyze & Optimize CV</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ATS Gap Analysis */}
      {currentStep === 2 && analysis && (
        <div>
          <div className="dashboard-grid">
            <AtsScoreDashboard
              analysis={analysis}
              optimizedAnalysis={optimizedAnalysis}
              isOptimized={Boolean(tailoredCv)}
            />

            <KeywordGaps analysis={analysis} />
          </div>

          <div className="action-trigger-area">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentStep(3)}
              disabled={!tailoredCv}
            >
              <span>View ATS Tailored CV</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tailored CV Preview, Score & Export */}
      {currentStep === 3 && tailoredCv && (
        <div>
          <IntegrityBadge
            integrityReport={integrityReport}
            optimizationMode={optimizationMode}
          />

          <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
            <AtsScoreDashboard
              analysis={analysis}
              optimizedAnalysis={optimizedAnalysis}
              isOptimized={true}
            />

            <KeywordGaps analysis={optimizedAnalysis || analysis} />
          </div>

          <ExportPanel tailoredCv={tailoredCv} />

          <ResumePreview
            originalCv={cvData}
            tailoredCv={tailoredCv}
            onUpdateTailoredCv={setTailoredCv}
          />
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
