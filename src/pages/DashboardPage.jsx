import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { fetchCommitments } from '../features/commitments/commitmentsSlice';
import DailyAlertBanner from '../components/Dashboard/DailyAlertBanner';
import CommitmentForm from '../components/Commitment/CommitmentForm';
import { IntegrityScore, IntegrityStreak } from '../components/Dashboard/StatsComponents';
import './DashboardPage.css';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user }  = useAuth();
  const status    = useSelector((state) => state.commitments.status);

  // useLayoutEffect fires synchronously BEFORE the browser paints.
  useLayoutEffect(() => {
    if (user && status === 'idle') {
      dispatch(fetchCommitments(user.uid));
    }
  }, [user, status, dispatch]);

  return (
    <div className="page dashboard-page">
      <div className="dashboard-grid">
        <aside className="dashboard-sidebar">
          <IntegrityScore />
          <IntegrityStreak />
        </aside>
        
        <div className="dashboard-main">
          <DailyAlertBanner />
          <CommitmentForm />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
