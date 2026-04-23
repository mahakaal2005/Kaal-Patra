import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  updateCommitment,
  deleteCommitment,
  fetchCommitments,
} from '../features/commitments/commitmentsSlice';
import { selectDerivedStats } from '../features/stats/statsSlice';
import JudgmentModal from '../components/Commitment/JudgmentModal';
import AICoachCard from '../components/Commitment/AICoachCard';
import { getAICoachMessage } from '../services/groqService';
import { formatDateTime, getDetailedTimeRemaining } from '../utils/timeUtils';
import './CommitmentDetailPage.css';

const CommitmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const { items, status } = useSelector((state) => state.commitments);
  const { score: integrityScore } = useSelector(selectDerivedStats);

  // Load if store is empty (e.g. direct URL hit)
  useEffect(() => {
    if (user && status === 'idle') {
      dispatch(fetchCommitments(user.uid));
    }
  }, [user, status, dispatch]);

  const commitment = items.find((c) => c.id === id);

  const [dailyLog, setDailyLog] = useState('');
  const [showJudgment, setShowJudgment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() =>
    commitment ? getDetailedTimeRemaining(commitment.deadline) : null
  );
  // AI Coach state
  const [aiMessage, setAiMessage] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!commitment || commitment.status === 'pending_judgment') return;
    const interval = setInterval(() => {
      setTimeLeft(getDetailedTimeRemaining(commitment.deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [commitment]);

  if (status === 'loading') {
    return (
      <div className="cdp-loading">
        <div className="cdp-spinner" />
        <p>Loading commitment…</p>
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="cdp-not-found">
        <h2>Commitment not found.</h2>
        <button className="cdp-back-btn" onClick={() => navigate('/commitments')}>
          ← Back to Commitments
        </button>
      </div>
    );
  }

  const {
    goal, sacrifice, deadline, penalty, reward,
    progressLogs = [], createdAt, status: cStatus,
  } = commitment;

  const isPending = cStatus === 'pending_judgment';
  const isCheckInRequired =
    !isPending &&
    (!commitment.lastLoggedDate || commitment.lastLoggedDate !== todayDateStr);

  const handleLogProgress = async () => {
    if (!dailyLog.trim()) return;
    const updatedLogs = [
      ...progressLogs,
      { date: todayDateStr, log: dailyLog.trim() },
    ];
    try {
      await dispatch(
        updateCommitment({
          uid: user.uid,
          commitmentId: id,
          updates: { progressLogs: updatedLogs, lastLoggedDate: todayDateStr },
        })
      ).unwrap();
      setDailyLog('');

      // 🤖 Trigger AI Coach after successful log
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
      setAiLoading(true);
      setAiError(null);
      setAiMessage(null);
      try {
        const msg = await getAICoachMessage({
          uid: user.uid,
          commitmentId: id,
          goal,
          sacrifice,
          progressLogs: updatedLogs,
          integrityScore,
          daysRemaining,
        });
        setAiMessage(msg);
      } catch (aiErr) {
        setAiError('Could not reach AI Coach right now. Try again later.');
        console.error('Groq error:', aiErr);
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      console.error('Failed to log progress:', err);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this commitment? This cannot be undone.')) {
      dispatch(deleteCommitment({ uid: user.uid, commitmentId: id }));
      navigate('/commitments');
    }
  };

  /* ─── Progress percentage (guard against missing/invalid timestamps) ─── */
  const createdTs = createdAt ? new Date(createdAt).getTime() : NaN;
  const endTs     = deadline  ? new Date(deadline).getTime()  : NaN;
  const now = Date.now();
  const hasValidRange = Number.isFinite(createdTs) && Number.isFinite(endTs) && endTs > createdTs;
  const progressPct = hasValidRange
    ? Math.min(100, Math.max(0, ((now - createdTs) / (endTs - createdTs)) * 100))
    : 0;

  return (
    <div className="page cdp">
      {/* Back + Actions bar */}
      <div className="cdp-topbar">
        <button className="cdp-back-btn" onClick={() => navigate('/commitments')}>
          ← Back
        </button>
        {cStatus === 'locked' && (
          <button className="cdp-delete-btn" onClick={handleDelete}>
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Header */}
      <div className={`cdp-header glass-panel ${isPending ? 'pending-glow' : ''}`}>
        <div className="cdp-header-meta">
          <span
            className={`cdp-badge ${
              isPending
                ? 'badge--pending'
                : isCheckInRequired
                ? 'badge--checkin'
                : 'badge--ok'
            }`}
          >
            {isPending
              ? '⚠️ Awaiting Judgment'
              : isCheckInRequired
              ? '🚨 Check-in Required'
              : '✅ On Track'}
          </span>
          {createdAt && (
            <span className="cdp-created">
              Forged on {formatDateTime(createdAt)}
            </span>
          )}
        </div>

        <h1 className="cdp-goal">{goal}</h1>

        <div className="cdp-sacrifice-row">
          <span className="cdp-field-lbl">Sacrifice</span>
          <span className="cdp-sacrifice-val">{sacrifice}</span>
        </div>

        {/* Time progress bar — only shown when both timestamps are valid */}
        {!isPending && hasValidRange && (
          <div className="cdp-time-bar">
            <div className="cdp-time-bar-track">
              <div
                className="cdp-time-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="cdp-time-bar-labels">
              <span>{formatDateTime(createdAt)}</span>
              <span>{Math.round(progressPct)}% elapsed</span>
              <span>{formatDateTime(deadline)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main body grid */}
      <div className="cdp-body">
        {/* LEFT — Stakes + Countdown */}
        <aside className="cdp-aside">
          {/* Stakes */}
          {(penalty || reward) && (
            <div className="cdp-card glass-panel">
              <h3 className="cdp-card-title">Stakes</h3>
              {penalty && (
                <div className="cdp-stake cdp-stake--fail">
                  <span className="cdp-stake-icon">❌</span>
                  <div>
                    <div className="cdp-stake-lbl">If I fail</div>
                    <div className="cdp-stake-val">{penalty}</div>
                  </div>
                </div>
              )}
              {reward && (
                <div className="cdp-stake cdp-stake--win">
                  <span className="cdp-stake-icon">🏆</span>
                  <div>
                    <div className="cdp-stake-lbl">If I win</div>
                    <div className="cdp-stake-val">{reward}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Countdown / Judgment CTA */}
          <div className="cdp-card glass-panel">
            {isPending ? (
              <div className="cdp-judgment-block">
                <div className="cdp-judgment-icon">⚡</div>
                <h3>Time is Up</h3>
                <p>You made a promise. Now face it.</p>
                <button
                  className="cdp-btn-judge"
                  onClick={() => setShowJudgment(true)}
                >
                  Face Your Judgment
                </button>
              </div>
            ) : (
              <>
                <h3 className="cdp-card-title">⏳ Unlocks In</h3>
                {timeLeft && (
                  <div className="cdp-countdown-grid">
                    {[
                      { val: timeLeft.days, lbl: 'DAYS' },
                      { val: timeLeft.hours, lbl: 'HRS' },
                      { val: timeLeft.minutes, lbl: 'MIN' },
                      { val: timeLeft.seconds, lbl: 'SEC' },
                    ].map(({ val, lbl }) => (
                      <div className="cdp-time-box" key={lbl}>
                        <span className="cdp-time-val">
                          {String(val).padStart(2, '0')}
                        </span>
                        <span className="cdp-time-lbl">{lbl}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="cdp-unlock-date">
                  📅 {formatDateTime(deadline)}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* RIGHT — Journey Map + Check-in */}
        <div className="cdp-main">
          {/* Check-in box (only if locked & needs check-in) */}
          {isCheckInRequired && (
            <div className="cdp-checkin-card glass-panel">
              <h3 className="cdp-card-title">
                🚨 Daily Check-In Required
              </h3>
              <p className="cdp-checkin-hint">
                What did you do today to get closer to your goal?
              </p>
              <div className="cdp-checkin-row">
                <textarea
                  className="cdp-checkin-input"
                  placeholder="Be specific. No vague answers."
                  rows={3}
                  value={dailyLog}
                  onChange={(e) => setDailyLog(e.target.value)}
                />
                <button className="cdp-btn-log" onClick={handleLogProgress}>
                  Log It
                </button>
              </div>
            </div>
          )}

          {/* AI Coach Card — appears after logging */}
          <AICoachCard
            message={aiMessage}
            isLoading={aiLoading}
            error={aiError}
          />

          {/* Journey Map */}
          <div className="cdp-card glass-panel">
            <div className="cdp-journey-header">
              <h3 className="cdp-card-title">Journey Map</h3>
              <span className="cdp-journey-count">
                {progressLogs.length} entries
              </span>
            </div>

            {progressLogs.length === 0 ? (
              <div className="cdp-journey-empty">
                <span>🗺️</span>
                <p>No progress logged yet. Log your first step!</p>
              </div>
            ) : (
              <div className="cdp-timeline">
                {[...progressLogs].reverse().map((entry, idx) => (
                  <div className="cdp-timeline-entry" key={idx}>
                    <div className="cdp-tl-dot" />
                    <div className="cdp-tl-content">
                      <div className="cdp-tl-date">{entry.date}</div>
                      <div className="cdp-tl-log">{entry.log}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Judgment Modal */}
      {showJudgment && (
        <JudgmentModal
          commitment={commitment}
          onClose={() => {
            setShowJudgment(false);
            navigate('/commitments');
          }}
        />
      )}
    </div>
  );
};

export default CommitmentDetailPage;
