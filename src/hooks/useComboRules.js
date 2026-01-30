import { useState, useEffect } from 'react';
import { fetchComboRules } from '../api.js';

export default function useComboRules() {
  const [rulesObj, setRulesObj] = useState(null);

  useEffect(() => {
    fetchComboRules()
      .then((res) => {
        const obj = {};
        (res.data || []).forEach((r) => {
          obj[r.key] = r;
        });
        setRulesObj(obj);
      })
      .catch(() => setRulesObj({}));
  }, []);

  return rulesObj;
} 