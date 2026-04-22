import PropTypes from 'prop-types';
import './AICoachCard.css';

/**
 * AICoachCard
 * Displays the AI-generated coaching message with shimmer → typewriter reveal.
 */
const AICoachCard = ({ message, isLoading, error }) => {
  if (!isLoading && !message && !error) return null;

  return (
    <div className={`ai-coach-card ${isLoading ? 'ai-coach--loading' : ''} ${error ? 'ai-coach--error' : ''}`}>
      <div className="ai-coach-header">
        <span className="ai-coach-icon">🤖</span>
        <span className="ai-coach-label">AI Coach</span>
        {!isLoading && !error && (
          <span className="ai-coach-badge">Powered by Groq · Llama 3</span>
        )}
      </div>

      {isLoading && (
        <div className="ai-coach-shimmer">
          <div className="shimmer-line shimmer-line--lg" />
          <div className="shimmer-line shimmer-line--md" />
          <div className="shimmer-line shimmer-line--sm" />
        </div>
      )}

      {error && !isLoading && (
        <p className="ai-coach-error-text">{error}</p>
      )}

      {message && !isLoading && !error && (
        <p className="ai-coach-message">{message}</p>
      )}
    </div>
  );
};

AICoachCard.propTypes = {
  message: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

export default AICoachCard;
