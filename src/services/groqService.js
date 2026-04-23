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

// NOTE: VITE_GROQ_API_KEY is bundled into the client build.
// For a production app, move this call behind a server-side endpoint
// (e.g. a Firebase Callable Function) so the key is never shipped to the browser.
// For this academic project the direct client call is acceptable.

/**
 * Safe localStorage helpers — storage can be unavailable or full.
 */
const safeGetCache = (key) => {
  try { return localStorage.getItem(key); }
  catch { return null; }
};

const safeSetCache = (key, value) => {
  try { localStorage.setItem(key, value); }
  catch { /* quota exceeded or storage disabled — silently skip cache */ }
};

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
  const lastLog = progressLogs.at(-1);
  const lastEntry = lastLog ? `"${lastLog.log}" (logged on ${lastLog.date})` : 'no logs yet';

  return `You are a master of motivational one-liners for a commitment-tracking app called KaalPatra.

The user has committed to: "${goal}"
What they gave up for it: "${sacrifice}"
Days left until deadline: ${daysRemaining}
Their integrity score (promises kept overall): ${integrityScore}%
Their most recent log entry: ${lastEntry}

Write EXACTLY ONE short, punchy motivational quote or line (maximum 20 words) that:
- Directly references their goal or sacrifice — not generic
- Feels like a powerful daily mantra or battle cry
- Is energising and forward-looking, NOT critical or analytical
- Uses vivid language — strong verbs, sharp imagery
- Does NOT use emojis, hashtags, or quotation marks
- Does NOT start with "You" or "I"
- Is a single sentence only — no explanations, no follow-up

Output only the one line. Nothing else.`;
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
  const cached = safeGetCache(cacheKey);
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
      max_tokens: 80,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content?.trim() ?? 'Stay the course.';

  // Cache for this day
  safeSetCache(cacheKey, message);

  return message;
};
