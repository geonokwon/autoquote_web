import React from 'react';
import { Box, TextField, Button } from '@mui/material';

const EstimateTitleSection = React.memo(function EstimateTitleSection({ 
    estimateTitle, 
    handleTitleChange,
    handleTitleBlur,
    titleError, 
    resetEstimate 
}) {
    return (
        <Box sx={{ position:'sticky', top:0, zIndex:1100, background:'#ffffff', pb:2, pt:1 }}>
        <Box sx={{ 
                width:'800px',
                mx:'auto',
                display:'flex',
                gap:2,
                alignItems:'center'
        }}>
            <TextField
                fullWidth
                label="견적서 제목"
                value={estimateTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                error={!!titleError}
                helperText={titleError}
                variant="outlined"
                autoComplete="off"
                sx={{
                        backgroundColor:'#fff',
                        flex:1,
                        '& .MuiOutlinedInput-root':{
                            height:'48px',
                            '& input': {
                                padding: '12px 14px'
                            }
                        },
                        '& .MuiFormHelperText-root':{position:'absolute',top:'100%',mt:'4px',ml:0}
                }}
            />
            <Button
                variant="contained"
                onClick={resetEstimate}
                    sx={{height:'48px',minWidth:'120px',backgroundColor:'#1976d2','&:hover':{backgroundColor:'#1565c0'}}}
            >
                새 견적서
            </Button>
            </Box>
        </Box>
    );
});

export default EstimateTitleSection;