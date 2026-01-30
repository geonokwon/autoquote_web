import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api.js';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [allowed, setAllowed] = useState(null); // null=loading, false=blocked, true=ok

  useEffect(() => {
    api.get('/me', { withCredentials: true })
      .then((res) => {
        const user = res.data;
        if (requireAdmin && user.role !== 'admin') {
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      })
      .catch(() => setAllowed(false));
  }, [requireAdmin]);

  if (allowed === null) return null; // loading, could render spinner
  if (!allowed) return <Navigate to="/login" replace />;
  return children;
} 