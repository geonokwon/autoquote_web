import React from 'react';
import ProductGroupBase from './ProductGroupBase.jsx';
import { productLabelMap } from '../utils/productLabelMap';

function aggregatePosArray(posArr = []) {
  const map = new Map();
  posArr.forEach((item) => {
    const key = item.customLabel || item.label;
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key);
      existing.quantity += item.quantity || 1;
      existing.price = existing.unitPrice * existing.quantity;
      map.set(key, existing);
    }
  });
  return Array.from(map.values());
}

function mapRows({ selectedOptions, genieoneKeys, services }) {
  const rows = [];

  // iterate all services in pos_water group
  services.filter((s) => s.group === 'pos_water').forEach((svc) => {
    const key = svc.key;
    const sel = selectedOptions[key];

    if (!sel || sel.label === '선택 안함') return;

    if (Array.isArray(sel)) {
      // array (e.g., pos)
      aggregatePosArray(sel).forEach((item) => {
        rows.push({
          key,
          label: item.customLabel || item.label,
          price: item.price,
          quantity: item.quantity,
          benefits: { ...item.benefits, oneTimePayment: item.oneTimePayment ?? item.benefits?.oneTimePayment },
          serviceName: svc.name,
          showChip: genieoneKeys.includes(key),
          chipLabel: services.find((s)=>s.key===key)?.label || productLabelMap[key] || productLabelMap['pos']
        });
      });
    } else {
      rows.push({
        key,
        label: sel.customLabel || sel.label,
        price: sel.price,
        quantity: sel.quantity || 1,
        benefits: { ...sel.benefits, oneTimePayment: sel.oneTimePayment ?? sel.benefits?.oneTimePayment },
        serviceName: svc.name,
        showChip: genieoneKeys.includes(key),
        chipLabel: services.find((s)=>s.key===key)?.label || productLabelMap[key] || productLabelMap['water']
      });
    }
  });

  return rows;
}

export default function PosWaterGroup({ selectedOptions, services, renderBenefits, genieoneKeys = [] }) {
  const rows = mapRows({ selectedOptions, genieoneKeys, services });
  if (rows.length === 0) return null;

  const subtotal = rows.reduce(
    (acc, r) => {
      acc.monthly += r.price || 0;
      acc.oneTime += (r.benefits?.oneTimePayment || 0);
      return acc;
    },
    { oneTime: 0, monthly: 0 }
  );

  return (
    <ProductGroupBase
      title="포스기 / 정수기"
      color="#4F5352"
      rows={rows}
      renderBenefits={renderBenefits}
      subtotal={subtotal}
    />
  );
}