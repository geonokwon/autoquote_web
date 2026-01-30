import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

/**
 * Generic product list used inside preview page.
 * Props:
 *  - title: heading text
 *  - iconSrc: optional icon image path
 *  - color: primary hex for texts
 *  - dashedColor: border color for dashed line
 *  - rows: array of { key,label, price, quantity, benefits, chipKey, showChip }
 *  - renderBenefits: function(benefits,color,qty,price) -> JSX
 *  - chipKeys: array of keys that should show chip (optional)
 *  - subtotal: optional { oneTime:number, monthly:number }
 */
export default function ProductGroupBase({
  title,
  color = '#4a5bb7',
  solidColor = '#BFBFBF',
  headerGradient = 'linear-gradient(90deg,#0C9CB1 0%,#82C8D4 100%)',
  rows = [],
  renderBenefits = () => null,
  chipKeys = [],
  subtotal
}) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '4px',
          background: headerGradient,
          px: 2,
          py: 0.2,
          mb: 0.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontFamily: 'GmarketSansBold', color: 'white', fontSize: '1.06rem' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '100px 180px', gap: 2 }}>
          <Typography sx={{ fontFamily: 'GmarketSansBold', color: 'white', fontSize: '0.9rem', textAlign: 'right' }}>일시납</Typography>
          <Typography sx={{ fontFamily: 'GmarketSansBold', color: 'white', fontSize: '0.9rem', textAlign: 'right' }}>월 납입료</Typography>
        </Box>
      </Box>

      {/* Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        {rows.map((row, idx) => (
          <Box
            key={`${row.key || 'row'}-${idx}`}
            sx={{ display: 'flex', alignItems: 'center', borderBottom: `1.3px solid ${solidColor}`, py: 0.3 }}
          >
            {/* Left label (service/sub title) */}
            <Box sx={{ width: '100px', textAlign: 'center', mr: 6 }}>
              <Typography sx={{ fontFamily: 'GmarketSansBold', color, fontSize: '0.85rem' }}>{row.serviceName || title}</Typography>
            </Box>
            {/* Content */}
            <Box sx={{ display: 'flex', flex: 1, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '500px', gap: 0.5 }}>
                {/* chip */}
                {row.showChip && (
                  <Box component="span" sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 17,
                    height: 17,
                    minWidth: 17,
                    borderRadius: '50%',
                    background: '#ff9797',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontFamily: 'GmarketSansBold',
                    fontSize: '0.62rem',
                    lineHeight: '17px',
                    mr: 1,
                    ml: -3,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    flex: '0 0 auto'
                  }}>
                    <Box component="span" sx={{ transform: 'translateX(0.25px)' }}>
                      {row.chipLabel || ''}
                    </Box>
                  </Box>
                )}
                {!row.showChip && <Box sx={{ width: 17, height: 17, minWidth: 0, mr: 1, ml: -3 }} />}

                {/* label & quantity */}
                <Typography sx={{ fontFamily: 'GmarketSansMedium', color: '#4F5352', fontSize: '0.85rem', minWidth: '180px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {row.label}
                  {row.quantity > 1 && ` (x${row.quantity})`}
                </Typography>
                {renderBenefits(row.benefits || {}, color, row.quantity || 1, row.price)}
              </Box>
            </Box>
            {/* price */}
            <Typography sx={{ width: '100px', textAlign: 'right', fontFamily: 'GmarketSansBold', color, fontSize: '0.85rem', pr: 2 }}>
              {row.price?.toLocaleString()}원
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Subtotal row */}
      {subtotal && (subtotal.oneTime > 0 || subtotal.monthly > 0) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 0.5,
            py: 0.3,
            pr: 2,
            bgcolor: '#f6f6f6',
            borderRadius: 1
          }}
        >
          <Box sx={{ width: '100px', mr: 1 }}>
            <Typography sx={{ color: '#FF1B1B', textAlign: 'center', fontFamily: 'GmarketSansBold', fontSize: '0.9rem' }}>
              소계
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {subtotal.oneTime > 0 && (
              <Typography sx={{ color: '#FF1B1B', fontFamily: 'GmarketSansBold', fontSize: '0.9rem', textAlign: 'right', width: '100px', mr: -0.7}}>
                {subtotal.oneTime.toLocaleString()}원
              </Typography>
            )}
            <Typography sx={{ color: '#FF1B1B', fontFamily: 'GmarketSansBold', fontSize: '0.9rem', textAlign: 'right', width: '180px' }}>
              {subtotal.monthly.toLocaleString()}원
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
} 