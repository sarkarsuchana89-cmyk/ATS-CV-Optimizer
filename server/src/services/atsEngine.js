const skillsCatalog = require('../data/skillsCatalog.json');

/**
 * Normalizes text for keyword search
 */
function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[\r\n\t]+/g, ' ');
}

/**
 * Finds all skills from catalog present in text (with synonyms)
 */
function extractCatalogSkills(text) {
  const norm = normalizeText(text);
  const foundSkills = [];
  const foundNames = new Set();

  for (const skill of skillsCatalog.skills) {
    // Check main name
    const mainRegex = new RegExp(`\\b${escapeRegExp(skill.name)}\\b`, 'i');
    let matched = mainRegex.test(norm);

    let matchedTerm = skill.name;

    if (!matched && skill.synonyms) {
      for (const syn of skill.synonyms) {
        const synRegex = new RegExp(`\\b${escapeRegExp(syn)}\\b`, 'i');
        if (synRegex.test(norm)) {
          matched = true;
          matchedTerm = syn;
          break;
        }
      }
    }

    if (matched && !foundNames.has(skill.name)) {
      foundNames.add(skill.name);
      foundSkills.push({
        name: skill.name,
        category: skill.category,
        matchedTerm: matchedTerm
      });
    }
  }

  // Also extract dynamic uppercase / tech acronyms or capitalized keywords
  const dynamicWords = text.match(/\b[A-Z][a-zA-Z0-9.+/#-]{2,}\b/g) || [];
  for (const word of dynamicWords) {
    const clean = word.trim();
    if (
      clean.length > 2 && 
      !foundNames.has(clean) && 
      !['The', 'And', 'For', 'With', 'Our', 'You', 'Will', 'Have', 'Work', 'Job', 'Team', 'Role', 'Company', 'Requirements', 'Responsibilities'].includes(clean)
    ) {
      // If it looks like a tech tool / library
      if (/^[A-Z][a-z]+[A-Z]/.test(clean) || /^[A-Z]{2,}$/.test(clean) || clean.includes('.') || clean.includes('+') || clean.includes('#')) {
        foundNames.add(clean);
        foundSkills.push({
          name: clean,
          category: 'Other Technical',
          matchedTerm: clean
        });
      }
    }
  }

  return foundSkills;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts experience requirements from JD (e.g., "5+ years", "3-5 years")
 */
function extractExperienceRequirement(jdText) {
  const match = jdText.match(/(\d+)\s*(?:\+|-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
  if (match) {
    return {
      raw: match[0],
      years: parseInt(match[1], 10)
    };
  }
  return null;
}

/**
 * Performs full ATS compatibility analysis between CV and JD
 */
function analyzeAtsCompatibility(cvData, jdText) {
  const cvRaw = cvData.rawText || JSON.stringify(cvData);
  const jdSkills = extractCatalogSkills(jdText);
  const cvSkills = extractCatalogSkills(cvRaw);

  // Map candidate's explicit skills
  const cvExplicitSkillsLower = (cvData.skills || []).map(s => s.toLowerCase());
  const cvRawLower = cvRaw.toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];
  const underrepresentedSkills = [];

  const cvSkillNameMap = new Map();
  cvSkills.forEach(s => cvSkillNameMap.set(s.name.toLowerCase(), s));

  // Check JD skills against CV
  for (const jdSkill of jdSkills) {
    const jdNameLower = jdSkill.name.toLowerCase();
    const isExplicit = cvExplicitSkillsLower.some(s => s.includes(jdNameLower) || jdNameLower.includes(s));
    const isPresentInText = cvSkillNameMap.has(jdNameLower) || cvRawLower.includes(jdNameLower);

    if (isPresentInText) {
      matchedSkills.push({
        ...jdSkill,
        explicit: isExplicit
      });

      if (!isExplicit && (cvData.skills && cvData.skills.length > 0)) {
        underrepresentedSkills.push(jdSkill.name);
      }
    } else {
      missingSkills.push(jdSkill);
    }
  }

  // Also include candidate extra skills that provide strong value
  const additionalCandidateSkills = cvSkills.filter(
    cs => !jdSkills.some(js => js.name.toLowerCase() === cs.name.toLowerCase())
  );

  // Calculate Subscores
  const totalJdSkillsCount = jdSkills.length || 1;
  const matchedCount = matchedSkills.length;
  const keywordMatchPercent = Math.min(100, Math.round((matchedCount / totalJdSkillsCount) * 100));

  // Experience requirement alignment
  const jdExpReq = extractExperienceRequirement(jdText);
  let experienceScore = 85; // default good base
  if (jdExpReq) {
    const cvYearsMatch = cvRaw.match(/(\d+)\+?\s*years?/i);
    const cvEstYears = cvYearsMatch ? parseInt(cvYearsMatch[1], 10) : (cvData.experience?.length ? cvData.experience.length * 2 : 3);
    if (cvEstYears >= jdExpReq.years) {
      experienceScore = 95;
    } else {
      experienceScore = Math.max(50, Math.round((cvEstYears / jdExpReq.years) * 90));
    }
  }

  // Formatting & Compliance Check
  const formattingIssues = [];
  let formatScore = 100;

  if (!cvData.contactInfo?.email) {
    formattingIssues.push({ type: 'error', message: 'Missing email address in contact section' });
    formatScore -= 15;
  }
  if (!cvData.contactInfo?.phone) {
    formattingIssues.push({ type: 'warning', message: 'Missing phone number in contact header' });
    formatScore -= 10;
  }
  if (!cvData.summary || cvData.summary.length < 30) {
    formattingIssues.push({ type: 'warning', message: 'Professional summary is missing or too brief' });
    formatScore -= 10;
  }
  if (!cvData.skills || cvData.skills.length === 0) {
    formattingIssues.push({ type: 'error', message: 'No dedicated skills section detected' });
    formatScore -= 20;
  }
  if (!cvData.experience || cvData.experience.length === 0) {
    formattingIssues.push({ type: 'error', message: 'No work experience section parsed' });
    formatScore -= 25;
  }
  if (!cvData.education || cvData.education.length === 0) {
    formattingIssues.push({ type: 'warning', message: 'No education section detected' });
    formatScore -= 10;
  }

  formatScore = Math.max(40, formatScore);

  // Overall ATS Score calculation (weighted)
  // Keyword match: 50%, Experience alignment: 25%, Formatting/Structure: 25%
  const overallAtsScore = Math.round(
    (keywordMatchPercent * 0.50) + 
    (experienceScore * 0.25) + 
    (formatScore * 0.25)
  );

  // Categorize matched and missing skills
  const categorizedMatched = categorizeSkills(matchedSkills);
  const categorizedMissing = categorizeSkills(missingSkills);

  // Actionable recommendations
  const recommendations = generateRecommendations({
    overallAtsScore,
    keywordMatchPercent,
    missingSkills,
    underrepresentedSkills,
    formattingIssues,
    jdExpReq
  });

  return {
    overallAtsScore,
    keywordMatchPercent,
    experienceScore,
    formatScore,
    totalJdKeywords: totalJdSkillsCount,
    matchedKeywordsCount: matchedCount,
    missingKeywordsCount: missingSkills.length,
    matchedSkills,
    missingSkills,
    underrepresentedSkills,
    additionalCandidateSkills,
    categorizedMatched,
    categorizedMissing,
    formattingIssues,
    recommendations,
    jdRequirements: {
      experience: jdExpReq ? `${jdExpReq.years}+ years` : 'Not explicitly specified',
      topSkills: jdSkills.slice(0, 8).map(s => s.name)
    }
  };
}

function categorizeSkills(skillList) {
  const categories = {};
  for (const item of skillList) {
    const cat = item.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item.name);
  }
  return categories;
}

function generateRecommendations(data) {
  const recs = [];

  if (data.underrepresentedSkills.length > 0) {
    recs.push({
      priority: 'High',
      title: 'Promote Underrepresented Skills',
      description: `You have experience with ${data.underrepresentedSkills.slice(0, 4).join(', ')} in your background, but they are not highlighted in your core Skills section. We will emphasize them in your tailored CV.`
    });
  }

  if (data.missingSkills.length > 0) {
    recs.push({
      priority: 'Medium',
      title: 'Address Target Keyword Gaps',
      description: `The job description emphasizes ${data.missingSkills.slice(0, 4).map(s => s.name).join(', ')}. Since these are not in your original CV, we strictly maintain honesty without fabricating them, while spotlighting your strongest transferable competencies.`
    });
  }

  if (data.keywordMatchPercent < 70) {
    recs.push({
      priority: 'High',
      title: 'Align Bullet Points to ATS Keywords',
      description: 'Strengthen existing bullet points using action-oriented impact phrasing that clearly demonstrates relevant domain terminology.'
    });
  } else {
    recs.push({
      priority: 'Low',
      title: 'Strong Keyword Alignment',
      description: 'Your background matches a solid proportion of the core tech stack. Fine-tuning the layout and bullet metrics will maximize your ATS ranking.'
    });
  }

  return recs;
}

module.exports = {
  extractCatalogSkills,
  analyzeAtsCompatibility
};
