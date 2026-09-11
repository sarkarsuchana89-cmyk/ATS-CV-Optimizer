/**
 * AI Service for optional Gemini API integration
 */
async function generateAiTailoredCv(originalCv, jdText, atsAnalysis, apiKey) {
  if (!apiKey) {
    throw new Error('No API key provided');
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) CV Optimization Engine.
Your goal is to tailor the candidate's CV specifically for the target Job Description while maintaining ABSOLUTE TRUTHFULNESS.

STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent or assume any technologies, tools, degrees, certifications, companies, job titles, or metrics not grounded in the Original CV.
2. If the Job Description requires a skill (e.g. "AWS", "Kubernetes", "Docker") that is NOT present in the candidate's CV, DO NOT ADD IT to the CV.
3. You may rewrite, improve, rephrase, and strengthen the candidate's existing experience and achievements using strong action verbs (e.g., "Architected", "Engineered", "Optimized", "Spearheaded") and ATS-aligned phrasing.
4. Structure bullet points as: Action Verb + What was done + Verified Technology/Skill + Result/Impact.
5. Reorder and highlight legitimately matching skills at the top.

ORIGINAL CV DATA:
${JSON.stringify(originalCv, null, 2)}

TARGET JOB DESCRIPTION:
${jdText}

MATCHED VERIFIED SKILLS:
${JSON.stringify(atsAnalysis.matchedSkills || [], null, 2)}

MISSING SKILLS (DO NOT ADD TO CV):
${JSON.stringify(atsAnalysis.missingSkills || [], null, 2)}

Return ONLY a valid JSON object matching this exact schema (no markdown fences, just pure JSON):
{
  "contactInfo": {
    "name": "string",
    "title": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "string (2-4 concise, powerful sentences tailored to JD keywords that the candidate genuinely possesses)",
  "skills": ["string", "string", ...],
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from AI model');
  }

  return JSON.parse(text);
}

module.exports = {
  generateAiTailoredCv
};
