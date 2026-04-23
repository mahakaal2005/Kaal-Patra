import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchCommitments as fetchFs, 
  addCommitment as addFs, 
  updateCommitment as updateFs, 
  deleteCommitment as deleteFs 
} from '../../firebase/firestoreService';

// Async Thunks (Unit 4 - Redux Async)
export const fetchCommitments = createAsyncThunk(
  'commitments/fetchAll',
  async (uid) => {
    return await fetchFs(uid);
  }
);

export const addCommitment = createAsyncThunk(
  'commitments/add',
  async ({ uid, commitmentData }) => {
    return await addFs(uid, commitmentData);
  }
);

export const updateCommitment = createAsyncThunk(
  'commitments/update',
  async ({ uid, commitmentId, updates }) => {
    return await updateFs(uid, commitmentId, updates);
  }
);

export const deleteCommitment = createAsyncThunk(
  'commitments/delete',
  async ({ uid, commitmentId }) => {
    return await deleteFs(uid, commitmentId);
  }
);

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const commitmentsSlice = createSlice({
  name: 'commitments',
  initialState,
  reducers: {
    // Call this on logout to prevent stale data leaking into next session
    resetCommitments: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCommitments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCommitments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCommitments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Add
      .addCase(addCommitment.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update
      .addCase(updateCommitment.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      // Delete
      .addCase(deleteCommitment.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const { resetCommitments } = commitmentsSlice.actions;
export default commitmentsSlice.reducer;
