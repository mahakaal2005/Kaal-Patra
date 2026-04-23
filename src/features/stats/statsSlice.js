import { createSlice } from '@reduxjs/toolkit';
import { fetchCommitments, addCommitment, updateCommitment, deleteCommitment } from '../commitments/commitmentsSlice';

// Helper function that uses Array ES6 methods (Unit 1 requirement)
const calculateStats = (commitments) => {
  if (!commitments || commitments.length === 0) {
    return { score: 0, streak: 0, totalFailed: 0, totalSuccess: 0 };
  }

  // Filter out pending/locked ones
  const resolved = commitments.filter(c => c.status === 'success' || c.status === 'failed');
  
  if (resolved.length === 0) {
    return { score: 0, streak: 0, totalFailed: 0, totalSuccess: 0 };
  }

  const successCount = resolved.filter(c => c.status === 'success').length;
  const score = Math.round((successCount / resolved.length) * 100);

  // Calculate streak (consecutive successes counting backward from most recent resolved)
  // Sort descending by unlock date
  const sortedResolved = [...resolved].sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  let streak = 0;
  for (const c of sortedResolved) {
    if (c.status === 'success') {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return {
    score,
    streak,
    totalFailed: resolved.length - successCount,
    totalSuccess: successCount
  };
};

const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    score: 0,
    streak: 0,
    totalFailed: 0,
    totalSuccess: 0
  },
  reducers: {},
  extraReducers: (builder) => {
    // We update stats whenever commitments change successfully
    const handleCommitmentChange = (state, action) => {
      // For fetch, the payload is the whole array.
      // For add/update/delete, we would ideally need the whole array again.
      // To keep it simple in Redux, derived state is often just selected in components via selectors using reselect.
      // But for this requirement, we'll listen to fetch.
    };

    builder.addCase(fetchCommitments.fulfilled, (state, action) => {
      const stats = calculateStats(action.payload);
      state.score = stats.score;
      state.streak = stats.streak;
      state.totalFailed = stats.totalFailed;
      state.totalSuccess = stats.totalSuccess;
    });
  }
});

export default statsSlice.reducer;

// Selectors
export const selectStats = (state) => state.stats;

// Selector to calculate stats purely from commitments state (Best Practice for derived data)
export const selectDerivedStats = (state) => calculateStats(state.commitments.items);
