import { useSelector } from 'react-redux';
import { selectDerivedStats } from '../../features/stats/statsSlice';
import './Stats.css';

/** Shimmer placeholder used while Firestore fetch is in flight */
const StatsSkeleton = ({ title }) => (
  <div className="glass-panel stats-panel">
    <h3>{title}</h3>
    <div className="stats-skeleton">
      <div className="stats-skel-circle" />
      <div className="stats-skel-line stats-skel-line--md" />
      <div className="stats-skel-line stats-skel-line--sm" />
    </div>
  </div>
);

export const IntegrityScore = () => {
  const status = useSelector((s) => s.commitments.status);
  const { score, totalSuccess, totalFailed } = useSelector(selectDerivedStats);

  // Show shimmer while fetch is in flight (idle = not started yet, loading = in progress)
  if (status === 'idle' || status === 'loading') {
    return <StatsSkeleton title="Integrity Score" />;
  }

  const total = totalSuccess + totalFailed;

  if (total === 0) {
    return (
      <div className="glass-panel stats-panel">
        <h3>Integrity Score</h3>
        <p className="stats-empty">No resolved promises yet.</p>
      </div>
    );
  }

  let colorClass = 'score-danger';
  if (score >= 80) colorClass = 'score-success';
  else if (score >= 50) colorClass = 'score-warning';

  return (
    <div className="glass-panel stats-panel">
      <h3>Integrity Score</h3>
      <div className={`score-circle ${colorClass}`}>
        <span className="score-value">{score}%</span>
      </div>
      <p className="score-subtext">You keep {score}% of your promises.</p>
      <div className="score-details">
        <span className="success-text">{totalSuccess} kept</span>
        <span className="divider">•</span>
        <span className="danger-text">{totalFailed} broken</span>
      </div>
    </div>
  );
};

export const IntegrityStreak = () => {
  const status = useSelector((s) => s.commitments.status);
  const { streak } = useSelector(selectDerivedStats);

  if (status === 'idle' || status === 'loading') {
    return <StatsSkeleton title="Daily Streak" />;
  }

  return (
    <div className="glass-panel stats-panel">
      <h3>Daily Streak</h3>
      <div className="streak-display">
        <span className="streak-icon">{streak > 0 ? '🔥' : '🧊'}</span>
        <span className="streak-value">{streak}</span>
      </div>
      <p className="streak-subtext">
        {streak === 0
          ? 'Log a check-in today to start your streak.'
          : streak === 1
          ? 'Day 1. Keep showing up.'
          : `${streak} consecutive days checked in.`}
      </p>
    </div>
  );
};
