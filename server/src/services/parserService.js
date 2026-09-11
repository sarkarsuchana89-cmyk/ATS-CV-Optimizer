const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from uploaded file buffer based on mimetype or extension
 */
async function extractRawText(fileBuffer, originalName, mimeType) {
  const ext = (originalName || '').split('.').pop().toLowerCase();
  
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text || '';
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mimeType === 'application/msword' || 
    ext === 'docx' || 
    ext === 'doc'
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value || '';
  } else {
    // Text or markdown
    return fileBuffer.toString('utf-8');
  }
}

/**
 * Intelligent section parser for CV text
 */
function parseCvStructure(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const normalized = rawText.replace(/\r\n/g, '\n');

  // 1. Extract contact information
  const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const portfolioMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/i);

  // Name heuristic: usually the first non-empty line before contact info
  let name = lines.length > 0 ? lines[0] : 'Candidate';
  if (name.includes('@') || name.includes('http') || name.length > 50) {
    // Look at second line or fall back
    const candidateNameLine = lines.slice(0, 3).find(l => !l.includes('@') && !l.includes('http') && l.length < 40);
    if (candidateNameLine) name = candidateNameLine;
  }

  // Common section header markers
  const sectionKeywords = [
    { key: 'summary', regex: /^(professional\s+summary|summary|profile|about\s+me|career\s+objective|objective)/i },
    { key: 'skills', regex: /^(technical\s+skills|core\s+skills|skills\s+&?\s+competencies|skills|technologies|proficiencies)/i },
    { key: 'experience', regex: /^(work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)/i },
    { key: 'education', regex: /^(education|academic\s+background|qualifications|academic\s+history)/i },
    { key: 'projects', regex: /^(key\s+projects|projects|personal\s+projects|notable\s+projects)/i },
    { key: 'certifications', regex: /^(certifications|licenses|certifications\s+&?\s+licenses|courses|accreditations)/i },
    { key: 'achievements', regex: /^(achievements|honors\s+&?\s+awards|awards|accomplishments)/i }
  ];

  // Group lines into sections
  const sections = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: [],
    other: []
  };

  let currentSection = 'other';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line matches a header
    let matchedHeader = null;
    for (const sec of sectionKeywords) {
      if (sec.regex.test(line) && line.length < 50) {
        matchedHeader = sec.key;
        break;
      }
    }

    if (matchedHeader) {
      currentSection = matchedHeader;
      continue;
    }

    // Skip candidate name / primary contact header line in 'other'
    if (currentSection === 'other' && i < 3 && (line === name || line.includes('@'))) {
      continue;
    }

    sections[currentSection].push(line);
  }

  // Parse Skills into structured array
  const rawSkillsText = sections.skills.join('\n');
  const skillsList = parseSkillsSection(rawSkillsText);

  // Parse Work Experience into structured items
  const experienceItems = parseExperienceSection(sections.experience);

  // Parse Education into structured items
  const educationItems = parseEducationSection(sections.education);

  // Parse Projects
  const projectItems = parseProjectsSection(sections.projects);

  // Parse Certifications
  const certItems = sections.certifications.filter(c => c.length > 3);

  return {
    rawText,
    contactInfo: {
      name: name.replace(/[^a-zA-Z\s.-]/g, '').trim() || 'Candidate Name',
      title: lines[1] && !lines[1].includes('@') && lines[1].length < 50 ? lines[1] : '',
      email: emailMatch ? emailMatch[1] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: extractLocation(lines),
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      portfolio: portfolioMatch && !emailMatch && !linkedinMatch && !githubMatch ? portfolioMatch[0] : ''
    },
    summary: sections.summary.join(' ').replace(/\s+/g, ' ').trim() || '',
    skills: skillsList,
    experience: experienceItems,
    education: educationItems,
    projects: projectItems,
    certifications: certItems,
    achievements: sections.achievements
  };
}

function extractLocation(lines) {
  const locationRegex = /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/;
  for (const line of lines.slice(0, 5)) {
    const m = line.match(locationRegex);
    if (m && !line.includes('@') && !line.includes('http')) {
      return m[0].trim();
    }
  }
  return '';
}

function parseSkillsSection(text) {
  if (!text) return [];
  // Split by commas, bullet points, pipes, newlines, or semicolons
  const items = text
    .split(/[,;•|\n\r\t]+/)
    .map(s => s.replace(/^[-*•]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 50 && !s.toLowerCase().includes('skills:'));
  
  // Clean duplicates preserving order
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
}

function parseExperienceSection(lines) {
  if (!lines || lines.length === 0) return [];
  const items = [];
  let currentItem = null;

  const dateRegex = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{4})\s*[-–—to\s]+\s*(?:Present|Current|\d{4}|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = dateRegex.test(line);

    // Heuristic: line looks like a job header if it has dates or has "Company | Title" or "Title at Company"
    if (hasDate || (line.includes('|') && i > 0 && !line.startsWith('•') && !line.startsWith('-')) || (line.toLowerCase().includes(' engineer') || line.toLowerCase().includes(' developer') || line.toLowerCase().includes(' manager') || line.toLowerCase().includes(' lead') || line.toLowerCase().includes(' consultant')) && line.length < 70 && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentItem && (currentItem.bullets.length > 0 || currentItem.description)) {
        items.push(currentItem);
      }

      let role = line;
      let company = '';
      let dates = '';
      let location = '';

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        dates = dateMatch[0];
        role = line.replace(dateMatch[0], '').replace(/[|–—,\s]+$/, '').trim();
      }

      if (role.includes('|')) {
        const parts = role.split('|').map(p => p.trim());
        role = parts[0];
        company = parts[1] || '';
      } else if (role.toLowerCase().includes(' at ')) {
        const parts = role.split(/\s+at\s+/i);
        role = parts[0];
        company = parts[1] || '';
      }

      currentItem = {
        role: role.trim() || 'Software Engineer',
        company: company.trim() || '',
        dates: dates.trim() || '',
        location: location.trim() || '',
        bullets: []
      };
    } else {
      if (!currentItem) {
        currentItem = {
          role: 'Professional Experience',
          company: '',
          dates: '',
          location: '',
          bullets: []
        };
      }
      const cleanBullet = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleanBullet.length > 5) {
        currentItem.bullets.push(cleanBullet);
      }
    }
  }

  if (currentItem && (currentItem.bullets.length > 0 || currentItem.role)) {
    items.push(currentItem);
  }

  return items;
}

function parseEducationSection(lines) {
  if (!lines || lines.length === 0) return [];
  const items = [];
  let currentItem = null;

  const degreeRegex = /(Bachelor|Master|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.D\.|Associate|BSc|MSc|Degree|Diploma)/i;
  const dateRegex = /\b(19\d{2}|20\d{2})\s*[-–—to\s]*\s*(19\d{2}|20\d{2}|Present|Current)?\b/i;

  for (const line of lines) {
    if (degreeRegex.test(line) || dateRegex.test(line) || line.includes('University') || line.includes('College') || line.includes('Institute')) {
      if (currentItem) items.push(currentItem);

      let degree = line;
      let institution = '';
      let dates = '';

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        dates = dateMatch[0];
        degree = line.replace(dateMatch[0], '').trim();
      }

      if (degree.includes('|') || degree.includes(',')) {
        const parts = degree.split(/[,|]/).map(p => p.trim());
        degree = parts[0];
        institution = parts[1] || '';
      }

      currentItem = {
        degree: degree.replace(/[|–—,\s]+$/, '').trim(),
        institution: institution.trim(),
        dates: dates.trim(),
        details: []
      };
    } else if (currentItem) {
      currentItem.details.push(line.replace(/^[-*•]+\s*/, '').trim());
    }
  }

  if (currentItem) items.push(currentItem);
  return items;
}

function parseProjectsSection(lines) {
  if (!lines || lines.length === 0) return [];
  const projects = [];
  let currentProject = null;

  for (const line of lines) {
    if (line.includes('|') || line.includes(':') && line.length < 60 && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentProject) projects.push(currentProject);
      const parts = line.split(/[:|]/).map(p => p.trim());
      currentProject = {
        name: parts[0],
        techStack: parts[1] || '',
        bullets: []
      };
    } else {
      if (!currentProject) {
        currentProject = {
          name: 'Project',
          techStack: '',
          bullets: []
        };
      }
      const clean = line.replace(/^[-*•]+\s*/, '').trim();
      if (clean.length > 5) {
        currentProject.bullets.push(clean);
      }
    }
  }

  if (currentProject) projects.push(currentProject);
  return projects;
}

module.exports = {
  extractRawText,
  parseCvStructure,
  parseSkillsSection
};
