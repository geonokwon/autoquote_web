import { useState, useEffect } from 'react';
import { fetchBenefitRules } from '../api.js';

/**
 * Fetch benefit-rule rows array from server and convert to keyed object for fast lookup.
 * Returns null until loaded (to match other hooks pattern).
 */
export default function useBenefitRules() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    fetchBenefitRules()
      .then((res) => {
        setRows(res.data || []);
      })
      .catch(() => setRows([]));
  }, []);

  return rows;
} 