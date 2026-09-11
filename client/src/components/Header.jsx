import React from 'react';
import { FileText, Settings, Sun, Moon, RotateCcw } from 'lucide-react';

export default function Header({ theme, toggleTheme, onOpenSettings, onReset, hasData }) {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon-box">
          <FileText size={24} />
        </div>
        <div>
          <div className="brand-title">
            ATS CV Optimizer
            <span className="brand-badge">Truthful AI</span>
          </div>
          <p className="brand-tagline">
            Tailor your resume to any job description — without compromising accuracy.
          </p>
        </div>
      </div>

      <div className="header-actions">
        {hasData && (
          <button 
            className="btn btn-outline"
            onClick={onReset}
            title="Start New Analysis"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        )}

        <button 
          className="btn btn-outline btn-icon-only"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onOpenSettings}
          title="Engine Settings & API Key"
        >
          <Settings size={17} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
