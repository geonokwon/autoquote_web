import { useState, useEffect } from 'react';
import { fetchProductBenefits } from '../api.js';

export default function useProductBenefitRows() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchProductBenefits().then((res) => setRows(res.data || []));
  }, []);

  return rows;
} 