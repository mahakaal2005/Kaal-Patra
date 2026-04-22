import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { getDetailedTimeRemaining } from '../../utils/timeUtils';
import './CommitmentCard.css';

const CommitmentCard = ({ commitment, onDelete }) => {
  const { status, goal, sacrifice, deadline, penalty, reward, progressLogs = [] } = commitment;
  const navigate = useNavigate();

  const isPending = status === 'pending_judgment';
  const todayDateStr = new Date().toISOString().split('T')[0];
  const isCheckInRequired =
    !isPending && (!commitment.lastLoggedDate || commitment.lastLoggedDate !== todayDateStr);

  const [timeLeft, setTimeLeft] = useState(() => getDetailedTimeRemaining(deadline));

  useEffect(() => {
    if (isPending) return;
    const interval = setInterval(() => {
      setTimeLeft(getDetailedTimeRemaining(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, isPending]);

  const handleCardClick = () => {
    navigate(`/commitments/${commitment.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // don't navigate when deleting
    e.preventDefault();  // don't scroll on Space key
    onDelete(commitment.id); // confirmation lives in the parent (CommitmentsPage)
  };

  /* Derive a short status label + colour class */
  const statusInfo = isPending
    ? { label: '⚠️ Judgment Due', cls: 'status--pending' }
    : isCheckInRequired
    ? { label: '🚨 Check-in Required', cls: 'status--checkin' }
    : { label: '✅ On Track', cls: 'status--ok' };

  return (
    <div
      className={`commitment-card-compact glass-panel ${isPending ? 'pending-glow' : ''} ${isCheckInRequired ? 'needs-checkin' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Activate on Enter or Space; ignore events from interactive children
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter') { handleCardClick(); }
        if (e.key === ' ')     { e.preventDefault(); handleCardClick(); }
      }}
      aria-label={`View commitment: ${goal}`}
    >
      {/* Top row */}
      <div className="ccc-top">
        <span className={`ccc-status ${statusInfo.cls}`}>{statusInfo.label}</span>
        {status === 'locked' && (
          <button className="btn-delete" onClick={handleDelete} aria-label="Delete commitment">
            🗑️
          </button>
        )}
      </div>

      {/* Goal */}
      <h3 className="ccc-goal">{goal}</h3>

      {/* Sacrifice */}
      <p className="ccc-sacrifice">
        <span className="ccc-label">Sacrifice:</span> {sacrifice}
      </p>

      {/* Stakes pills */}
      {(penalty || reward) && (
        <div className="ccc-stakes">
          {penalty && <span className="ccc-pill ccc-pill--fail">❌ {penalty}</span>}
          {reward && <span className="ccc-pill ccc-pill--win">🏆 {reward}</span>}
        </div>
      )}

      {/* Footer — countdown OR pending CTA */}
      <div className="ccc-footer">
        {isPending ? (
          <span className="ccc-judgment-cta">Tap to face your judgment →</span>
        ) : (
          <div className="ccc-mini-countdown">
            <span className="ccc-countdown-val">
              {String(timeLeft.days).padStart(2, '0')}d{' '}
              {String(timeLeft.hours).padStart(2, '0')}h{' '}
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span className="ccc-countdown-lbl">remaining · {progressLogs.length} logs</span>
          </div>
        )}
        <span className="ccc-arrow">→</span>
      </div>
    </div>
  );
};

CommitmentCard.propTypes = {
  commitment: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CommitmentCard;
