/**
 * AI Service for Gemini API integration
 * Handles AI ATS Analysis and AI CV Tailoring using modern Gemini 3 series models
 */

const SUPPORTED_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

/**
 * Sanitizes API keys by trimming whitespace, quotes, and trailing semicolons
 */
function sanitizeApiKey(key) {
  if (!key) return '';
  return String(key).trim().replace(/^["'\s]+|["';\s]+$/g, '');
}

/**
 * Robust caller for Gemini API generateContent endpoint with automatic model fallback across Gemini 3 series
 */
async function callGeminiApi(prompt, rawApiKey, temperature = 0.2) {
  const apiKey = sanitizeApiKey(rawApiKey);
  if (!apiKey) {
    throw new Error('No Gemini API key provided. Please configure GEMINI_API_KEY in .env or Settings.');
  }

  let lastError = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = null;
        try {
          parsedError = JSON.parse(errorText);
        } catch (e) {}

        const errorMsg = parsedError?.error?.message || errorText;
        console.warn(`[Gemini API] Model ${model} returned HTTP ${response.status}: ${errorMsg}`);

        // If authentication error (bad API key), fail immediately
        if (response.status === 400 && errorMsg.includes('API_KEY_INVALID')) {
          throw new Error(`Invalid Gemini API Key: ${errorMsg}`);
        }

        // For 404 (model retired) or 503 (high demand), record and try next supported model
        lastError = new Error(`Model ${model} returned HTTP ${response.status}: ${errorMsg}`);
        continue;
      }

      const result = await response.json();
      const rawOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput) {
        console.warn(`Model ${model} returned empty content, trying next candidate...`);
        continue;
      }

      // Clean markdown code blocks if model wrapped JSON
      const cleanJson = rawOutput.replace(/^```json\s*|^```\s*|```$/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      if (err.message.includes('Invalid Gemini API Key')) {
        throw err;
      }
      console.warn(`Attempt with ${model} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Gemini API call failed across candidate models: ${lastError?.message}`);
}

/**
 * 1. AI-Powered ATS Analysis (Step 2)
 * Uses Gemini to evaluate CV against JD, extract matched/missing keywords, and compute accurate ATS sub-scores
 */
async function generateAiAtsAnalysis(cvData, jdText, apiKey) {
  const prompt = `You are an advanced Applicant Tracking System (ATS) Evaluation and Keyword Gap Engine.
Analyze the provided Candidate CV strictly against the Target Job Description using AI.

Evaluate thoroughly:
1. Overall ATS Score (0-100) calculated realistically as:
   - Keyword Match (50% weight)
   - Experience Alignment (25% weight)
   - Formatting & Section Structure (25% weight)
2. Matched Keywords & Skills that legitimately exist in BOTH the CV and the JD. Categorize each (e.g. "Languages", "Frontend", "Backend", "Databases", "Cloud & DevOps", "Tools & Methodologies").
3. Missing Keywords & Skills explicitly required/preferred in the JD that are NOT found in the CV. Categorize each.
4. Underrepresented / Hidden Strengths: Technologies or skills found in the candidate's work bullets/projects that are omitted from their primary Skills list.
5. Actionable ATS recommendations with priority ("High", "Medium", "Low"), title, and detailed practical description.
6. Formatting issues or structural warnings (e.g., missing summary, no dates, missing contact info).

CANDIDATE CV:
${JSON.stringify(cvData, null, 2)}

TARGET JOB DESCRIPTION:
${jdText}

Return ONLY a valid JSON object matching this exact schema:
{
  "overallAtsScore": number,
  "keywordMatchPercent": number,
  "experienceScore": number,
  "formatScore": number,
  "totalJdKeywords": number,
  "matchedKeywordsCount": number,
  "missingKeywordsCount": number,
  "matchedSkills": [
    { "name": "string", "category": "string", "explicit": true }
  ],
  "missingSkills": [
    { "name": "string", "category": "string" }
  ],
  "underrepresentedSkills": ["string"],
  "additionalCandidateSkills": [
    { "name": "string", "category": "string" }
  ],
  "categorizedMatched": {
    "CategoryName": ["skill1", "skill2"]
  },
  "categorizedMissing": {
    "CategoryName": ["skill1", "skill2"]
  },
  "formattingIssues": [
    { "type": "warning", "message": "string" }
  ],
  "recommendations": [
    { "priority": "High", "title": "string", "description": "string" }
  ],
  "jdRequirements": {
    "experience": "string",
    "topSkills": ["string"]
  }
}`;

  const parsed = await callGeminiApi(prompt, apiKey, 0.1);

  // Guarantee all essential UI fallback keys exist
  return {
    overallAtsScore: Math.min(100, Math.max(0, Math.round(parsed.overallAtsScore || 70))),
    keywordMatchPercent: Math.min(100, Math.max(0, Math.round(parsed.keywordMatchPercent || 65))),
    experienceScore: Math.min(100, Math.max(0, Math.round(parsed.experienceScore || 80))),
    formatScore: Math.min(100, Math.max(0, Math.round(parsed.formatScore || 90))),
    totalJdKeywords: parsed.totalJdKeywords || (parsed.matchedSkills?.length || 0) + (parsed.missingSkills?.length || 0) || 10,
    matchedKeywordsCount: parsed.matchedSkills?.length || parsed.matchedKeywordsCount || 0,
    missingKeywordsCount: parsed.missingSkills?.length || parsed.missingKeywordsCount || 0,
    matchedSkills: parsed.matchedSkills || [],
    missingSkills: parsed.missingSkills || [],
    underrepresentedSkills: parsed.underrepresentedSkills || [],
    additionalCandidateSkills: parsed.additionalCandidateSkills || [],
    categorizedMatched: parsed.categorizedMatched || {},
    categorizedMissing: parsed.categorizedMissing || {},
    formattingIssues: parsed.formattingIssues || [],
    recommendations: parsed.recommendations || [],
    jdRequirements: parsed.jdRequirements || {
      experience: 'Specified in JD',
      topSkills: (parsed.missingSkills || []).slice(0, 5).map(s => s.name || s)
    }
  };
}

/**
 * 2. AI-Powered Truthful CV Tailoring (Step 3)
 * Uses Gemini to optimize summary and rewrite work experience bullets using strong action verbs
 */
async function generateAiTailoredCv(originalCv, jdText, atsAnalysis, apiKey) {
  const candidateName = originalCv.contactInfo?.name || 'Candidate Name';
  const candidateEmail = originalCv.contactInfo?.email || '';
  const candidatePhone = originalCv.contactInfo?.phone || '';
  const candidateLocation = originalCv.contactInfo?.location || '';
  const candidateLinkedin = originalCv.contactInfo?.linkedin || '';
  const candidateGithub = originalCv.contactInfo?.github || '';
  const candidatePortfolio = originalCv.contactInfo?.portfolio || '';

  const prompt = `You are an expert ATS (Applicant Tracking System) CV Optimization Engine.
Your goal is to tailor the candidate's CV specifically for the target Job Description while maintaining ABSOLUTE TRUTHFULNESS.

STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent or assume any technologies, tools, degrees, certifications, companies, job titles, or metrics not grounded in the Original CV.
2. Candidate identity MUST be preserved exactly:
   - Name: "${candidateName}"
   - Email: "${candidateEmail}"
   - Phone: "${candidatePhone}"
   - Location: "${candidateLocation}"
   - Employers/Companies and Dates must match the original CV.
3. If the Job Description requires a skill that is NOT present in the candidate's CV, DO NOT ADD IT to the CV skills or bullets.
4. Rewrite, enhance, and strengthen the candidate's existing experience and achievements using strong action verbs (e.g., "Architected", "Engineered", "Optimized", "Spearheaded") and ATS-aligned phrasing.
5. Structure bullet points as: Action Verb + What was done + Verified Technology/Skill + Result/Impact.
6. Reorder and highlight legitimately matching skills at the top.

ORIGINAL CV DATA:
${JSON.stringify(originalCv, null, 2)}

TARGET JOB DESCRIPTION:
${jdText}

MATCHED VERIFIED SKILLS:
${JSON.stringify(atsAnalysis.matchedSkills || [], null, 2)}

MISSING SKILLS (DO NOT ADD TO CV):
${JSON.stringify(atsAnalysis.missingSkills || [], null, 2)}

Return ONLY a valid JSON object matching this schema:
{
  "contactInfo": {
    "name": "${candidateName}",
    "title": "string",
    "email": "${candidateEmail}",
    "phone": "${candidatePhone}",
    "location": "${candidateLocation}",
    "linkedin": "${candidateLinkedin}",
    "github": "${candidateGithub}",
    "portfolio": "${candidatePortfolio}"
  },
  "summary": "string (2-4 concise, impactful sentences tailored to JD keywords that the candidate genuinely possesses)",
  "skills": ["string", "string"],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "dates": "string",
      "location": "string",
      "bullets": [
        "string (impactful, ATS-optimized bullet using only verified facts)",
        "..."
      ]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "dates": "string",
      "details": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "techStack": "string",
      "bullets": ["string"]
    }
  ],
  "certifications": ["string"],
  "achievements": ["string"]
}`;

  const tailoredResult = await callGeminiApi(prompt, apiKey, 0.2);
  console.log("gemini is worked");
  return tailoredResult;
}

module.exports = {
  sanitizeApiKey,
  generateAiAtsAnalysis,
  generateAiTailoredCv
};
