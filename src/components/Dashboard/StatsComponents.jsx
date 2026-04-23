import { useSelector } from 'react-redux';
import { selectDerivedStats } from '../../features/stats/statsSlice';
import './Stats.css';

export const IntegrityScore = () => {
  const { score, totalSuccess, totalFailed } = useSelector(selectDerivedStats);
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
  const { streak } = useSelector(selectDerivedStats);

  return (
    <div className="glass-panel stats-panel">
      <h3>Current Streak</h3>
      <div className="streak-display">
        <span className="streak-icon">{streak > 0 ? '🔥' : '🧊'}</span>
        <span className="streak-value">{streak}</span>
      </div>
      <p className="streak-subtext">
        {streak === 0 ? "Your streak is broken. Start over." : "Consecutive promises kept."}
      </p>
    </div>
  );
};
