import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { selectDerivedStats } from '../features/stats/statsSlice';
import {
  fetchLeaderboard,
  updateLeaderboardEntry,
  removeLeaderboardEntry,
  calcWeeklyCheckInRate,
  deriveDisplayName,
} from '../firebase/leaderboardService';
import './CommunityPage.css';

const TABS = [
  { id: 'integrity', label: '🏆 Hall of Honor', field: 'integrityScore', suffix: '%', desc: 'Promises kept' },
  { id: 'streak',    label: '🔥 On Fire',       field: 'streak',         suffix: '',  desc: 'Current streak' },
  { id: 'weekly',    label: '📅 This Week',      field: 'weeklyCheckInRate', suffix: '%', desc: 'Weekly check-in rate' },
];

const CommunityPage = () => {
  const { user } = useAuth();
  const stats = useSelector(selectDerivedStats);
  const commitments = useSelector((s) => s.commitments.items);

  const [tab, setTab] = useState('integrity');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  /* ─── Load leaderboard ───────────────────────────────── */
  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
      // Check if current user is on the board
      const myEntry = data.find((e) => e.uid === user.uid);
      setIsPublic(!!myEntry);
    } catch (e) {
      setError('Failed to load leaderboard. Check your Firestore rules.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  /* ─── Toggle opt-in / opt-out ────────────────────────── */
  const handleToggle = async () => {
    setToggling(true);
    try {
      if (isPublic) {
        await removeLeaderboardEntry(user.uid);
        setIsPublic(false);
        setEntries((prev) => prev.filter((e) => e.uid !== user.uid));
      } else {
        const weeklyCheckInRate = calcWeeklyCheckInRate(commitments);
        await updateLeaderboardEntry(user, { ...stats, weeklyCheckInRate });
        setIsPublic(true);
        // Optimistic update
        setEntries((prev) => {
          const without = prev.filter((e) => e.uid !== user.uid);
          return [
            ...without,
            {
              uid: user.uid,
              displayName: deriveDisplayName(user),
              integrityScore: stats.score,
              streak: stats.streak,
              totalKept: stats.totalSuccess,
              totalFailed: stats.totalFailed,
              weeklyCheckInRate,
              isPublic: true,
            },
          ];
        });
      }
    } catch (e) {
      console.error('Toggle error:', e);
    } finally {
      setToggling(false);
    }
  };

  /* ─── Sort entries for current tab ──────────────────── */
  const activeTab = TABS.find((t) => t.id === tab);
  const sorted = [...entries]
    .filter((e) => e.isPublic !== false)
    .sort((a, b) => (b[activeTab.field] ?? 0) - (a[activeTab.field] ?? 0));

  const myRank = sorted.findIndex((e) => e.uid === user.uid) + 1;

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="page community-page">
      {/* Hero */}
      <div className="cm-hero glass-panel">
        <div className="cm-hero-text">
          <h1 className="cm-title">Community</h1>
          <p className="cm-subtitle">
            Hold yourself accountable alongside others. Integrity is built in public.
          </p>
        </div>
        <div className="cm-opt-toggle">
          {isPublic && myRank > 0 && (
            <span className="cm-my-rank">Your rank: <strong>#{myRank}</strong></span>
          )}
          <button
            className={`cm-toggle-btn ${isPublic ? 'cm-toggle-btn--on' : ''}`}
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling
              ? '...'
              : isPublic
              ? '✅ Showing on Leaderboard'
              : '👤 Join Leaderboard'}
          </button>
          {isPublic && (
            <span className="cm-toggle-hint">Click to go private</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="cm-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cm-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      {loading ? (
        <div className="cm-loading">
          <div className="cm-spinner" />
          <p>Loading warriors…</p>
        </div>
      ) : error ? (
        <div className="cm-error">{error}</div>
      ) : sorted.length === 0 ? (
        <div className="cm-empty">
          <div className="cm-empty-icon">🏜️</div>
          <h3>No one's here yet.</h3>
          <p>Be the first to join the leaderboard.</p>
        </div>
      ) : (
        <div className="cm-table-wrap glass-panel">
          <div className="cm-table-header">
            <span className="cm-col cm-col--rank">#</span>
            <span className="cm-col cm-col--name">Name</span>
            <span className="cm-col cm-col--score">{activeTab.desc}</span>
            <span className="cm-col cm-col--bar"></span>
            <span className="cm-col cm-col--kept">Kept</span>
            <span className="cm-col cm-col--failed">Failed</span>
          </div>

          {sorted.map((entry, idx) => {
            const isMe = entry.uid === user.uid;
            const val = entry[activeTab.field] ?? 0;
            const maxVal = sorted[0]?.[activeTab.field] ?? 1;
            const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

            return (
              <div
                key={entry.uid}
                className={`cm-row ${isMe ? 'cm-row--me' : ''} ${idx < 3 ? 'cm-row--podium' : ''}`}
              >
                <span className="cm-col cm-col--rank">
                  {medal || `#${idx + 1}`}
                </span>
                <span className="cm-col cm-col--name">
                  {entry.displayName}
                  {isMe && <span className="cm-you-badge">You</span>}
                </span>
                <span className="cm-col cm-col--score">
                  {val}{activeTab.suffix}
                </span>
                <span className="cm-col cm-col--bar">
                  <div className="cm-bar-track">
                    <div
                      className={`cm-bar-fill ${isMe ? 'cm-bar-fill--me' : ''}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </span>
                <span className="cm-col cm-col--kept">
                  <span className="cm-kept-val">{entry.totalKept ?? 0}</span>
                </span>
                <span className="cm-col cm-col--failed">
                  <span className="cm-failed-val">{entry.totalFailed ?? 0}</span>
                </span>
              </div>
            );
          })}

          {/* Pin own row if not visible */}
          {isPublic && myRank > 10 && (
            <div className="cm-pinned-me">
              <span className="cm-pinned-label">Your position · #{myRank}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
