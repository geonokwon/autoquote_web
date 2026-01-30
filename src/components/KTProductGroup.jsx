import React from 'react';
import ProductGroupBase from './ProductGroupBase.jsx';
import { productLabelMap } from '../utils/productLabelMap';

function mapRows({ selectedOptions, services, renderBenefits, genieoneKeys }) {
    const rows = [];
    // internet wifi tv phone servingbot
    services.filter(s => s.group === 'kt_product' && s.key !== 'highorder').map(s=>s.key).forEach((key) => {
                    const opt = selectedOptions[key];
        if (!opt || opt.label === '선택 안함' || (Array.isArray(opt) && opt.length === 0)) return;

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

    // highorder array (multi-select service)
    const highorders = Array.isArray(selectedOptions.highorder) ? selectedOptions.highorder : [];
    highorders.forEach((item) => {
        rows.push({
            key: 'highorder',
            label: item.customLabel || item.label,
            price: item.price,
            quantity: item.quantity,
            benefits: item.benefits,
            serviceName: '하이오더',
            showChip: genieoneKeys.includes('highorder'),
            chipLabel: services.find((s)=>s.key==='highorder')?.label || productLabelMap['highorder']
        });
    });
    return rows;
}

export default function KTProductGroup(props) {
    const { selectedOptions, services, renderBenefits, genieoneKeys = [] } = props;
    const rows = mapRows({ selectedOptions, services, renderBenefits, genieoneKeys });

    const subtotal = rows.reduce(
        (acc, r) => {
            const qty = r.quantity || 1;
            acc.monthly += (r.price || 0);
            acc.oneTime += (r.benefits?.oneTimePayment || 0);
            return acc;
        },
        { oneTime: 0, monthly: 0 }
    );

    if (rows.length === 0) return null;

    return (
        <ProductGroupBase
            title="KT 상품"
            color="#4F5352"
            rows={rows}
            renderBenefits={renderBenefits}
            subtotal={subtotal}
        />
    );
}