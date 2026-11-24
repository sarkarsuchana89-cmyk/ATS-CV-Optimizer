const actionVerbs = require('../data/actionVerbs.json');
const skillsCatalog = require('../data/skillsCatalog.json');
const { validateTruthfulness } = require('./validatorService');
const { generateAiTailoredCv, sanitizeApiKey } = require('./aiService');

/**
 * Optimizes CV truthfully based on JD and ATS analysis
 */
async function optimizeCv({ originalCv, jdText, atsAnalysis, apiKey }) {
  let tailoredCv = null;
  let optimizationMode = 'algorithmic';

  // 1. If Gemini API key is provided, perform AI optimization (no silent fallback)
  const effectiveKey = sanitizeApiKey(apiKey || process.env.GEMINI_API_KEY);
  if (effectiveKey) {
    tailoredCv = await generateAiTailoredCv(originalCv, jdText, atsAnalysis, effectiveKey);
    optimizationMode = 'ai_gemini';
    console.log("gemini is worked");
  } else {
    // 2. Only use deterministic algorithmic optimizer if no API key is supplied
    tailoredCv = algorithmicOptimizeCv(originalCv, jdText, atsAnalysis);
    optimizationMode = 'algorithmic_nlp';
  }

  // 3. Strict Truthfulness & Integrity Validation
  const integrityReport = validateTruthfulness(originalCv, tailoredCv);
  const finalCv = integrityReport.sanitizedCv;

  // 4. Generate Diff Summary for UI comparison
  const diffSummary = generateDiffSummary(originalCv, finalCv);

  return {
    tailoredCv: finalCv,
    optimizationMode,
    integrityReport,
    diffSummary
  };
}

/**
 * High-fidelity Algorithmic ATS Optimizer
 */
function algorithmicOptimizeCv(cv, jdText, atsAnalysis) {
  const matchedSkillNames = (atsAnalysis.matchedSkills || []).map(s => s.name);
  const matchedSet = new Set(matchedSkillNames.map(s => s.toLowerCase()));

  // 1. Optimize Contact Info
  const contactInfo = {
    name: cv.contactInfo?.name || 'Candidate Name',
    title: deriveOptimizedTitle(cv, jdText, matchedSkillNames),
    email: cv.contactInfo?.email || '',
    phone: cv.contactInfo?.phone || '',
    location: cv.contactInfo?.location || '',
    linkedin: cv.contactInfo?.linkedin || '',
    github: cv.contactInfo?.github || '',
    portfolio: cv.contactInfo?.portfolio || ''
  };

  // 2. Reorder & Group Skills
  // Combine original skills + any underrepresented skills discovered in candidate's experience
  const candidateVerifiedSkills = [...(cv.skills || [])];
  if (atsAnalysis.underrepresentedSkills) {
    for (const skill of atsAnalysis.underrepresentedSkills) {
      if (!candidateVerifiedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        candidateVerifiedSkills.push(skill);
      }
    }
  }

  // Sort matching skills first
  const prioritizedSkills = [];
  const otherSkills = [];

  for (const skill of candidateVerifiedSkills) {
    if (matchedSet.has(skill.toLowerCase())) {
      prioritizedSkills.push(skill);
    } else {
      otherSkills.push(skill);
    }
  }

  const finalSkills = [...prioritizedSkills, ...otherSkills];

  // 3. Optimize Professional Summary
  const summary = generateOptimizedSummary(cv, jdText, matchedSkillNames, contactInfo.title);

  // 4. Optimize Work Experience Bullets
  const experience = (cv.experience || []).map(job => {
    return {
      role: job.role,
      company: job.company,
      dates: job.dates,
      location: job.location,
      bullets: (job.bullets || []).map(b => optimizeBulletPoint(b, matchedSkillNames, finalSkills))
    };
  });

  // 5. Optimize Projects
  const projects = (cv.projects || []).map(proj => {
    return {
      name: proj.name,
      techStack: proj.techStack,
      bullets: (proj.bullets || []).map(b => optimizeBulletPoint(b, matchedSkillNames, finalSkills))
    };
  });

  // 6. Format Education & Certifications
  const education = cv.education || [];
  const certifications = cv.certifications || [];
  const achievements = cv.achievements || [];

  return {
    contactInfo,
    summary,
    skills: finalSkills,
    experience,
    education,
    projects,
    certifications,
    achievements
  };
}

function deriveOptimizedTitle(cv, jdText, matchedSkills) {
  if (cv.contactInfo?.title) return cv.contactInfo.title;
  if (cv.experience?.[0]?.role) return cv.experience[0].role;
  return 'Software Engineer';
}

function generateOptimizedSummary(cv, jdText, matchedSkills, title) {
  const yearsMatch = (cv.rawText || '').match(/(\d+)\+?\s*years?/i);
  const yearsExp = yearsMatch ? `${yearsMatch[1]}+ years` : 'proven track record';
  
  const topMatched = matchedSkills.slice(0, 5).join(', ');
  
  let summary = '';
  if (cv.summary && cv.summary.length > 40) {
    // Enhance existing summary by clarifying verified strengths
    summary = cv.summary;
    if (topMatched && !summary.toLowerCase().includes(matchedSkills[0]?.toLowerCase())) {
      summary += ` Proficient in ${topMatched} with focus on delivering robust, scalable, and maintainable solutions aligned with engineering objectives.`;
    }
  } else {
    summary = `Results-oriented ${title} with ${yearsExp} of professional experience. Demonstrated expertise in ${topMatched || 'software development and modern architectures'}. Proven ability to collaborate with cross-functional teams, optimize performance, and engineer reliable end-to-end solutions.`;
  }

  return summary.trim();
}

/**
 * Transforms a raw bullet point into Action Verb + Task + Verified Skills + Impact
 */
function optimizeBulletPoint(bullet, matchedSkills, candidateSkills) {
  let clean = bullet.replace(/^[-*•\d.]+\s*/, '').trim();
  if (clean.length < 10) return clean;

  // Check if bullet starts with a weak verb or passive phrasing
  const weakStarters = [
    { regex: /^(worked on|helped with|responsible for|assisted in|involved in|handled)\s+/i, replacement: 'Engineered ' },
    { regex: /^(made|did|created)\s+/i, replacement: 'Developed ' },
    { regex: /^(fixed|resolved bugs in)\s+/i, replacement: 'Diagnosed and resolved critical issues in ' },
    { regex: /^(wrote code for|wrote)\s+/i, replacement: 'Authored and deployed modular code for ' },
    { regex: /^(supported|helped)\s+/i, replacement: 'Collaborated on ' },
    { regex: /^(looked at|checked)\s+/i, replacement: 'Evaluated and optimized ' }
  ];

  for (const item of weakStarters) {
    if (item.regex.test(clean)) {
      clean = clean.replace(item.regex, item.replacement);
      break;
    }
  }

  // Ensure starts with capitalized strong action verb
  const firstWord = clean.split(' ')[0];
  if (firstWord.endsWith('ing')) {
    // E.g., "Developing..." -> "Developed..."
    clean = firstWord.replace(/ing$/, 'ed') + clean.slice(firstWord.length);
  }

  // Check if bullet already has punctuation
  if (!clean.endsWith('.')) {
    clean += '.';
  }

  return clean;
}

function generateDiffSummary(originalCv, optimizedCv) {
  const originalBulletsCount = (originalCv.experience || []).reduce((acc, e) => acc + (e.bullets?.length || 0), 0);
  const optimizedBulletsCount = (optimizedCv.experience || []).reduce((acc, e) => acc + (e.bullets?.length || 0), 0);

  return {
    originalSkillsCount: originalCv.skills?.length || 0,
    optimizedSkillsCount: optimizedCv.skills?.length || 0,
    originalBulletsCount,
    optimizedBulletsCount,
    summaryUpdated: originalCv.summary !== optimizedCv.summary
  };
}

module.exports = {
  optimizeCv
};
