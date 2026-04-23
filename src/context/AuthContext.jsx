import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import PropTypes from 'prop-types';
import { store } from '../app/store';
import { resetCommitments } from '../features/commitments/commitmentsSlice';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track previous uid so we only reset when the user actually changes
  const prevUidRef = useRef(null);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const newUid = currentUser?.uid ?? null;
      const oldUid = prevUidRef.current;

      // If the user changed (logout, or switch account) wipe Redux so
      // stale commitments from session A never show during session B.
      if (oldUid !== newUid) {
        store.dispatch(resetCommitments());
      }

      prevUidRef.current = newUid;
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { user, signup, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="auth-loading-screen">
          <div className="auth-spinner" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
