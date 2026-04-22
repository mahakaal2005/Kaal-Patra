/**
 * leaderboardService.js
 * Manages the public leaderboard collection in Firestore.
 * Structure: leaderboard/{uid} — readable by everyone, writable only by owner.
 */

import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const LEADERBOARD_COLLECTION = 'leaderboard';

/**
 * Derive a safe display name from a Firebase user object.
 * e.g. "atulkumarsingh20052005@gmail.com" → "Atul K."
 * Falls back to "Anonymous" if nothing can be parsed.
 */
export const deriveDisplayName = (user) => {
  if (!user) return 'Anonymous';
  // Try displayName first (set during social login etc.)
  if (user.displayName) {
    const parts = user.displayName.trim().split(' ');
    const first = parts[0] || '';
    const lastInitial = parts[1] ? parts[1][0].toUpperCase() + '.' : '';
    return `${first} ${lastInitial}`.trim();
  }
  // Fall back to email prefix
  const emailPrefix = (user.email || '').split('@')[0];
  // Strip numbers and underscores, split by common separators
  const cleaned = emailPrefix.replace(/[0-9_]/g, ' ').trim();
  const words = cleaned.split(/[\s.]+/).filter(Boolean);
  if (words.length === 0) return 'Anonymous';
  const first = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  const lastInitial = words[1] ? words[1][0].toUpperCase() + '.' : '';
  return `${first} ${lastInitial}`.trim();
};

/**
 * Upsert the user's public stats on the leaderboard.
 * Call this after any judgment or opt-in toggle.
 */
export const updateLeaderboardEntry = async (user, stats) => {
  const { score, streak, totalSuccess, totalFailed, weeklyCheckInRate = 0 } = stats;
  const ref = doc(db, LEADERBOARD_COLLECTION, user.uid);
  await setDoc(
    ref,
    {
      displayName: deriveDisplayName(user),
      integrityScore: score,
      streak,
      totalKept: totalSuccess,
      totalFailed,
      weeklyCheckInRate,
      isPublic: true,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Remove the user's entry from the leaderboard (opt-out).
 */
export const removeLeaderboardEntry = async (uid) => {
  const ref = doc(db, LEADERBOARD_COLLECTION, uid);
  await deleteDoc(ref);
};

/**
 * Fetch all public leaderboard entries, sorted by integrityScore descending.
 * @returns {Promise<Array>}
 */
export const fetchLeaderboard = async () => {
  const snapshot = await getDocs(collection(db, LEADERBOARD_COLLECTION));
  return snapshot.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => (b.integrityScore ?? 0) - (a.integrityScore ?? 0));
};

/**
 * Calculate what percentage of days this week the user logged a check-in.
 * @param {Array} commitments - all user commitments
 * @returns {number} 0–100
 */
export const calcWeeklyCheckInRate = (commitments) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const activeLocked = commitments.filter((c) => c.status === 'locked');
  if (activeLocked.length === 0) return 100; // no commitments = no obligations

  let checkedInCount = 0;
  activeLocked.forEach((c) => {
    if (c.lastLoggedDate) {
      const logDate = new Date(c.lastLoggedDate);
      if (logDate >= weekAgo) checkedInCount++;
    }
  });

  return Math.round((checkedInCount / activeLocked.length) * 100);
};
