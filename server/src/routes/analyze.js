const express = require('express');
const { analyzeAtsCompatibility } = require('../services/atsEngine');

const router = express.Router();

/**
 * POST /api/analyze
 * Analyzes CV data against JD text
 */
router.post('/', async (req, res) => {
  try {
    const { cvData, jdText } = req.body;

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required.' });
    }
    if (!jdText || jdText.trim().length === 0) {
      return res.status(400).json({ error: 'Job description text is required.' });
    }

    const analysis = analyzeAtsCompatibility(cvData, jdText);

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('Error in ATS analysis:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

module.exports = router;
