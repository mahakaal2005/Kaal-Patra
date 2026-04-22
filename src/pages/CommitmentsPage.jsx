import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  fetchCommitments,
  deleteCommitment,
  updateCommitment,
} from '../features/commitments/commitmentsSlice';
import CommitmentCard from '../components/Commitment/CommitmentCard';
import { isUnlocked } from '../utils/timeUtils';
import './CommitmentsPage.css';

const CommitmentsPage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { items, status } = useSelector((state) => state.commitments);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user && status === 'idle') {
      dispatch(fetchCommitments(user.uid));
    }
  }, [user, status, dispatch]);

  // Auto-unlock checker
  useEffect(() => {
    const interval = setInterval(() => {
      const needsUpdate = items.filter(
        (c) => c.status === 'locked' && isUnlocked(c.deadline)
      );
      needsUpdate.forEach((c) => {
        dispatch(
          updateCommitment({
            uid: user.uid,
            commitmentId: c.id,
            updates: { status: 'pending_judgment' },
          })
        );
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [items, dispatch, user]);

  const activeItems = items.filter(
    (c) => c.status === 'locked' || c.status === 'pending_judgment'
  );

  const pendingItems = activeItems.filter((c) => c.status === 'pending_judgment');
  const lockedItems = activeItems.filter((c) => c.status === 'locked');
  const needsCheckin = lockedItems.filter((c) => {
    const today = new Date().toISOString().split('T')[0];
    return !c.lastLoggedDate || c.lastLoggedDate !== today;
  });

  const filtered =
    filter === 'pending'
      ? pendingItems
      : filter === 'checkin'
      ? needsCheckin
      : activeItems;

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this locked commitment?')) {
      dispatch(deleteCommitment({ uid: user.uid, commitmentId: id }));
    }
  };

  return (
    <div className="page commitments-page">
      {/* Hero Banner */}
      <div className="cp-hero">
        <div className="cp-hero-text">
          <h1 className="cp-title">Active Commitments</h1>
          <p className="cp-subtitle">
            Every promise you lock in here is a debt to your future self. Pay up.
          </p>
        </div>
        <div className="cp-stats-bar">
          <div className="cp-stat">
            <span className="cp-stat-val">{activeItems.length}</span>
            <span className="cp-stat-lbl">Total Active</span>
          </div>
          <div className="cp-stat cp-stat--danger">
            <span className="cp-stat-val">{pendingItems.length}</span>
            <span className="cp-stat-lbl">Awaiting Judgment</span>
          </div>
          <div className="cp-stat cp-stat--warning">
            <span className="cp-stat-val">{needsCheckin.length}</span>
            <span className="cp-stat-lbl">Need Check-in</span>
          </div>
          <div className="cp-stat cp-stat--success">
            <span className="cp-stat-val">{lockedItems.length - needsCheckin.length}</span>
            <span className="cp-stat-lbl">On Track Today</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="cp-filters">
        <button
          className={`cp-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="cp-badge">{activeItems.length}</span>
        </button>
        <button
          className={`cp-filter-btn ${filter === 'checkin' ? 'active' : ''}`}
          onClick={() => setFilter('checkin')}
        >
          🚨 Need Check-in <span className="cp-badge cp-badge--warning">{needsCheckin.length}</span>
        </button>
        <button
          className={`cp-filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          ⚠️ Judgment Due <span className="cp-badge cp-badge--danger">{pendingItems.length}</span>
        </button>
      </div>

      {/* Content */}
      {status === 'loading' ? (
        <div className="cp-loading">
          <div className="cp-spinner" />
          <p>Loading your promises…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cp-empty">
          <div className="cp-empty-icon">🔐</div>
          <h3>
            {filter === 'all'
              ? 'No active commitments yet.'
              : 'Nothing here right now.'}
          </h3>
          <p>
            {filter === 'all'
              ? 'Go to the Dashboard and forge your next commitment.'
              : 'Switch to "All" to see everything.'}
          </p>
        </div>
      ) : (
        <div className="cp-grid">
          {filtered.map((item) => (
            <CommitmentCard
              key={item.id}
              commitment={item}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default CommitmentsPage;
