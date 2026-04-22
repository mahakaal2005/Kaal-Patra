import DailyAlertBanner from '../components/Dashboard/DailyAlertBanner';
import CommitmentForm from '../components/Commitment/CommitmentForm';
import { IntegrityScore, IntegrityStreak } from '../components/Dashboard/StatsComponents';
import './DashboardPage.css';

const DashboardPage = () => {
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
