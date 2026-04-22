/**
 * groqService.js
 * Calls the Groq API (OpenAI-compatible) to generate a personalized
 * motivational message for a commitment after a daily log.
 *
 * Caches the response in localStorage per user/commitment/day so we
 * only hit the API once per commitment per day.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Build a cache key unique to this user + commitment + calendar day.
 */
const getCacheKey = (uid, commitmentId) => {
  const today = new Date().toISOString().split('T')[0];
  return `ai_coach_${uid}_${commitmentId}_${today}`;
};

/**
 * Build the prompt sent to the model.
 */
const buildPrompt = ({ goal, sacrifice, progressLogs = [], integrityScore, daysRemaining }) => {
  const recentLogs = progressLogs
    .slice(-3)
    .map((l) => `  - ${l.date}: "${l.log}"`)
    .join('\n');

  return `You are a brutally honest but motivating accountability coach for someone using an app called KaalPatra — a system that forces people to confront their commitments.

Here is what you know about this person's commitment:
- Goal: "${goal}"
- Sacrifice they made: "${sacrifice}"
- Days remaining until deadline: ${daysRemaining}
- Their current integrity score (% of promises kept overall): ${integrityScore}%
- Their most recent progress logs:
${recentLogs || '  (No logs yet — they just started)'}

Write a SHORT, personalized motivational message (2–3 sentences max). 
Rules:
- Reference their actual goal and recent logs — do NOT be generic
- Be direct and honest. Not fluffy or corporate.
- If their logs show slipping, call it out gently but firmly
- End with a specific, actionable push for today
- Do NOT use emojis or hashtags
- Do NOT start with "I" or "You are"`;
};

/**
 * Main export — fetches AI coach message, uses cache to avoid repeat calls.
 * @param {object} params
 * @param {string} params.uid - Firebase user ID (for cache key)
 * @param {string} params.commitmentId
 * @param {string} params.goal
 * @param {string} params.sacrifice
 * @param {Array}  params.progressLogs - array of { date, log }
 * @param {number} params.integrityScore - 0–100
 * @param {number} params.daysRemaining
 * @returns {Promise<string>} The motivational message
 */
export const getAICoachMessage = async ({
  uid,
  commitmentId,
  goal,
  sacrifice,
  progressLogs,
  integrityScore,
  daysRemaining,
}) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return 'Add your VITE_GROQ_API_KEY to .env to unlock AI coaching.';
  }

  // Check cache first
  const cacheKey = getCacheKey(uid, commitmentId);
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const prompt = buildPrompt({ goal, sacrifice, progressLogs, integrityScore, daysRemaining });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content?.trim() ?? 'Stay the course.';

  // Cache for this day
  localStorage.setItem(cacheKey, message);

  return message;
};
