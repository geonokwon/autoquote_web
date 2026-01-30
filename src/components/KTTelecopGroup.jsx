import React from 'react';
import ProductGroupBase from './ProductGroupBase.jsx';
import { productLabelMap } from '../utils/productLabelMap';

function mapRows({ selectedOptions, services, genieoneKeys }) {
  const serviceKeys = services.filter(s => s.group === 'kt_telecop').map(s => s.key);
  const rows = [];

  serviceKeys.forEach((key) => {
    const opt = selectedOptions[key];

    if (!opt || (Array.isArray(opt) ? opt.length === 0 : opt.label === '선택 안함')) return;

    // CASE 1: single object
    if (!Array.isArray(opt)) {
      rows.push({
        key,
        label: opt.customLabel || opt.label,
        price: opt.price,
        quantity: opt.quantity || 1,
        benefits: opt.benefits,
        serviceName: services.find((s) => s.key === key)?.name,
        showChip: genieoneKeys.includes(key),
        chipLabel: services.find((s)=>s.key===key)?.label || productLabelMap[key]
      });
      return;
    }

    // CASE 2: array (multi-select)
    opt.forEach((item) => {
      rows.push({
        key,
        label: item.customLabel || item.label,
        price: item.price,
        quantity: item.quantity || 1,
        benefits: item.benefits,
        serviceName: services.find((s) => s.key === key)?.name,
        showChip: genieoneKeys.includes(key),
        chipLabel: services.find((s)=>s.key===key)?.label || productLabelMap[key]
      });
    });
  });

  return rows;
}

export default function KTTelecopGroup({ selectedOptions, services, renderBenefits, genieoneKeys = [] }) {
  const rows = mapRows({ selectedOptions, services, genieoneKeys });
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
      title="KT 텔레캅"
      color="#4F5352"
      rows={rows}
      renderBenefits={renderBenefits}
      subtotal={subtotal}
    />
  );
}