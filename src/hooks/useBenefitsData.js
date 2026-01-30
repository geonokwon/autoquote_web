import { useState, useEffect } from 'react';
import { fetchBenefits } from '../api.js';

export default function useBenefitsData() {
  const [benefits, setBenefits] = useState([]);

  useEffect(() => {
    fetchBenefits().then((res) => setBenefits(res.data));
  }, []);

  return benefits;
} 