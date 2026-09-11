const express = require('express');
const { optimizeCv } = require('../services/optimizerService');
const { analyzeAtsCompatibility } = require('../services/atsEngine');

const router = express.Router();

/**
 * POST /api/optimize
 * Optimizes candidate CV for the JD truthfully
 */
router.post('/', async (req, res) => {
  try {
    const { cvData, jdText, atsAnalysis, apiKey } = req.body;

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required.' });
    }
    if (!jdText) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    // Perform optimization
    const result = await optimizeCv({
      originalCv: cvData,
      jdText,
      atsAnalysis: atsAnalysis || analyzeAtsCompatibility(cvData, jdText),
      apiKey
    });

    // Compute updated post-optimization ATS score
    const optimizedAnalysis = analyzeAtsCompatibility(result.tailoredCv, jdText);

    res.json({
      success: true,
      tailoredCv: result.tailoredCv,
      optimizationMode: result.optimizationMode,
      integrityReport: result.integrityReport,
      diffSummary: result.diffSummary,
      originalAnalysis: atsAnalysis || analyzeAtsCompatibility(cvData, jdText),
      optimizedAnalysis
    });
  } catch (err) {
    console.error('Error optimizing CV:', err);
    res.status(500).json({ error: 'Optimization failed: ' + err.message });
  }
});

module.exports = router;
