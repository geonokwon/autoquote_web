import { useState, useEffect } from 'react';
import { fetchBundleBenefits } from '../api.js';

export default function useBundleBenefits() {
  const [bundles, setBundles] = useState(null);

  useEffect(() => {
    fetchBundleBenefits()
      .then((res) => setBundles(res.data || []))
      .catch(() => setBundles([]));
  }, []);

  return bundles;
} 