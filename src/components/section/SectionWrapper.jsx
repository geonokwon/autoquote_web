import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Common wrapper for a selection section – renders a top border, title and optional header on the right.
 * Children are rendered below fully stretched.
 */
export default function SectionWrapper({ title, extraHeader = null, children }) {
    return (
        <Box sx={{ width: 800, mx: 'auto', borderTop: '2px solid #eee', pt: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {title}
                </Typography>
                {extraHeader}
            </Box>
            {children}
        </Box>
    );
} 