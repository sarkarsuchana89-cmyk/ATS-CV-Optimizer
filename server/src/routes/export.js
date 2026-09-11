const express = require('express');
const crypto = require('crypto');
const { generateDocx } = require('../services/docxGenerator');

const router = express.Router();

// In-memory cache for temporary download files (auto-expire after 10 mins)
const fileCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, item] of fileCache.entries()) {
    if (now - item.timestamp > 10 * 60 * 1000) {
      fileCache.delete(id);
    }
  }
}, 60 * 1000);

/**
 * POST /api/export/prepare
 * Prepares the DOCX file and returns a direct, browser-native download URL
 */
router.post('/prepare', async (req, res) => {
  try {
    let cvData = req.body.cvData || req.body.cvDataJson;
    if (typeof cvData === 'string') {
      try {
        cvData = JSON.parse(cvData);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid CV data payload.' });
      }
    }

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required.' });
    }

    const buffer = await generateDocx(cvData);
    const rawName = cvData.contactInfo?.name || 'Candidate';
    const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Candidate';
    const filename = `${cleanName}_ATS_Tailored_Resume.docx`;

    const fileId = crypto.randomBytes(12).toString('hex');
    fileCache.set(fileId, {
      buffer,
      filename,
      timestamp: Date.now()
    });

    const downloadUrl = `/api/export/file/${fileId}/${encodeURIComponent(filename)}`;

    res.json({
      success: true,
      downloadUrl,
      filename
    });
  } catch (err) {
    console.error('Error preparing DOCX download:', err);
    res.status(500).json({ error: 'Failed to prepare download: ' + err.message });
  }
});

/**
 * GET /api/export/file/:id/:filename
 * Direct browser-native GET download endpoint
 */
router.get('/file/:id/:filename', (req, res) => {
  try {
    const { id } = req.params;
    const fileItem = fileCache.get(id);

    if (!fileItem) {
      return res.status(404).send('Download link expired or not found. Please click download again.');
    }

    const filename = fileItem.filename;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*="UTF-8''${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', fileItem.buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(fileItem.buffer);
  } catch (err) {
    console.error('Error serving download file:', err);
    res.status(500).send('Error downloading file: ' + err.message);
  }
});

/**
 * POST /api/export/docx
 * Direct POST download fallback
 */
router.post('/docx', async (req, res) => {
  try {
    let cvData = req.body.cvData || req.body.cvDataJson;
    if (typeof cvData === 'string') {
      try {
        cvData = JSON.parse(cvData);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid CV data payload.' });
      }
    }

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required.' });
    }

    const buffer = await generateDocx(cvData);
    const rawName = cvData.contactInfo?.name || 'Candidate';
    const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Candidate';
    const filename = `${cleanName}_ATS_Tailored_Resume.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*="UTF-8''${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  } catch (err) {
    console.error('Error generating DOCX:', err);
    res.status(500).json({ error: 'Failed to generate DOCX: ' + err.message });
  }
});

module.exports = router;
