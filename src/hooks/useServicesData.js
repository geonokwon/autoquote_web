import { useEffect, useState } from 'react';
import { fetchServices } from '../api.js';
import { setServicesList } from '../constants/discountRules.js';

/**
 * Fetch services from json-server backend. Falls back to bundled constants when request fails.
 * Keeps result in state; does not refetch unless explicit reload is needed.
 */
export default function useServicesData() {
  const sortServices = (arr) => [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [services, setServices] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchServices();
        if (mounted && Array.isArray(res?.data) && res.data.length) {
          const mapped = res.data.map((s) => ({
            ...s,
            isDiscount: s.isDiscount ?? (s.category === '할인'),
            isCardDiscount: s.isCardDiscount ?? (s.category === '카드할인'),
            isBenefit: s.isBenefit ?? (s.category === '혜택')
          }));
          const sorted = sortServices(mapped);
          setServices(sorted);
          // Provide list to discountRules for dynamic name lookup
          setServicesList(sorted);
        }
      } catch (e) {
        console.error('[useServicesData] Failed to load services from API:', e.message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return services;
} 