const express = require('express');
const { analyzeAtsCompatibility } = require('../services/atsEngine');
const { generateAiAtsAnalysis, sanitizeApiKey } = require('../services/aiService');

const router = express.Router();

/**
 * POST /api/analyze
 * Analyzes CV data against JD text using Gemini AI (with fallback to catalog when no key configured)
 */
router.post('/', async (req, res) => {
  try {
    const { cvData, jdText, apiKey } = req.body;

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required.' });
    }
    if (!jdText || jdText.trim().length === 0) {
      return res.status(400).json({ error: 'Job description text is required.' });
    }

    const effectiveKey = sanitizeApiKey(apiKey || process.env.GEMINI_API_KEY);
    let analysis;
    let analysisMode = 'algorithmic';

    if (effectiveKey) {
      // Analyze with Gemini AI when key is provided
      analysis = await generateAiAtsAnalysis(cvData, jdText, effectiveKey);
      analysisMode = 'ai_gemini';
    } else {
      // Deterministic baseline if no key is provided
      analysis = analyzeAtsCompatibility(cvData, jdText);
      analysisMode = 'algorithmic';
    }

    res.json({
      success: true,
      analysis,
      analysisMode
    });
  } catch (err) {
    console.error('Error in ATS analysis:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

module.exports = router;
