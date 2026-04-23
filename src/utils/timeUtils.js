/**
 * Time utility functions for KaalPatra
 */

/**
 * Check if a message should be unlocked based on current time
 * @param {string} unlockAt - ISO timestamp when message unlocks
 * @returns {boolean} true if current time >= unlock time
 */
export const isUnlocked = (unlockAt) => {
  const now = new Date().getTime();
  const unlockTime = new Date(unlockAt).getTime();
  return now >= unlockTime;
};

/**
 * Format a timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} formatted date and time
 */
export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return date.toLocaleString('en-US', options);
};

/**
 * Get time remaining until unlock
 * @param {string} unlockAt - ISO timestamp when message unlocks
 * @returns {string} human-readable time remaining
 */
export const getTimeRemaining = (unlockAt) => {
  const now = new Date().getTime();
  const unlockTime = new Date(unlockAt).getTime();
  const diff = unlockTime - now;

  if (diff <= 0) {
    return 'Unlocked';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m remaining`;
  } else {
    return 'Less than a minute';
  }
};

/**
 * Get detailed time remaining for live countdown widgets
 * @param {string} unlockAt - ISO timestamp when message unlocks
 * @returns {Object} { days, hours, minutes, seconds, isUnlocked }
 */
export const getDetailedTimeRemaining = (unlockAt) => {
  const now = new Date().getTime();
  const unlockTime = new Date(unlockAt).getTime();
  const diff = unlockTime - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { 
    days, 
    hours, 
    minutes, 
    seconds, 
    isUnlocked: false 
  };
};

