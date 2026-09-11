const express = require('express');
const multer = require('multer');
const { extractRawText, parseCvStructure } = require('../services/parserService');

const router = express.Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/parse/cv
 * Upload CV document (PDF, DOCX, TXT)
 */
router.post('/cv', upload.single('file'), async (req, res) => {
  try {
    let rawText = '';
    if (req.file) {
      rawText = await extractRawText(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: 'Please upload a CV file or supply raw text.' });
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the provided document. Please check the file format.' });
    }

    const structured = parseCvStructure(rawText);

    res.json({
      success: true,
      rawText,
      structured
    });
  } catch (err) {
    console.error('Error parsing CV:', err);
    res.status(500).json({ error: 'Failed to process CV: ' + err.message });
  }
});

/**
 * POST /api/parse/jd
 * Upload Job Description document or parse text
 */
router.post('/jd', upload.single('file'), async (req, res) => {
  try {
    let rawText = '';
    if (req.file) {
      rawText = await extractRawText(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: 'Please provide JD text or upload a document.' });
    }

    res.json({
      success: true,
      text: rawText.trim()
    });
  } catch (err) {
    console.error('Error parsing JD:', err);
    res.status(500).json({ error: 'Failed to process Job Description: ' + err.message });
  }
});

module.exports = router;
