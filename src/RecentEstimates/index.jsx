import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { 
    Box, 
    Typography, 
    List, 
    ListItem,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { fetchQuotes, fetchQuote, deleteQuote } from '../api.js';
import EstimateService from '../domain/EstimateService.js';
import useServicesData from '../hooks/useServicesData.js';

const RecentEstimates = forwardRef(({ onLoadEstimate }, ref) => {
    const services = useServicesData();

    const [allFiles, setAllFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, fileName: null });
    const [page, setPage] = useState(0);
    const itemsPerPage = 20;

    const loadAllFiles = async () => {
        try {
            const res = await fetchQuotes();
            const files = res.data || res;
            // 시간순 정렬 (최신순)
            const sortedFiles = files.sort((a, b) => new Date(b.modifiedAt || b.timestamp) - new Date(a.modifiedAt || a.timestamp));
            // 최신 로직으로 합계 재계산하여 표시
            const recalculated = sortedFiles.map(f => {
                if (f.selectedOptions && Object.keys(f.selectedOptions).length > 0) {
                    try {
                        const calc = EstimateService.calculate(
                            f.selectedOptions,
                            services,
                            f.isCardDiscountApplied || false,
                            [],
                            [],
                            {},
                            {}
                        );
                        return { ...f, _calcFinalTotal: calc.finalTotal };
                    } catch {}
                }
                // fallback to stored value
                return { ...f, _calcFinalTotal: f.finalTotal };
            });
            setAllFiles(recalculated);
        } catch(e){ console.error(e); }
    };

    useImperativeHandle(ref, () => ({
        loadAllFiles
    }));

    useEffect(() => {
        loadAllFiles();
    }, []);

    const handleDelete = async () => {
        if (!deleteDialog.fileName) return;
        
        try {
            await deleteQuote(deleteDialog.fileName);
            await loadAllFiles(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting estimate:', error);
        }
        setDeleteDialog({ open: false, fileName: null });
    };

    // 검색어에 따른 필터링
    const filteredFiles = allFiles.filter(file => {
        const searchText = file.title || file.fileName?.replace(/\.json$/, '') || '';
        return searchText.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const paginatedFiles = filteredFiles.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    // 검색어 변경 시 페이지 초기화
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    return (
        <Paper sx={{ 
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ 
                p: 2, 
                pt: 5,  // 상단 여백 추가
                borderBottom: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1  // 제목과 검색창 사이 여백 추가
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>견적서 목록</Typography>
                    <IconButton onClick={loadAllFiles} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Box>
                <TextField
                    size="small"
                    placeholder="견적서 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    fullWidth
                />
            </Box>
            
            <List sx={{ flex: 1, overflowY: 'auto' }}>
                {paginatedFiles.map((file, index) => (
                    <ListItem 
                        key={index}
                        sx={{
                            borderBottom: '1px solid #f5f5f5',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: 1,
                            py: 2
                        }}
                    >
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {file.title || file.fileName?.replace(/\.json$/, '')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(file.timestamp || file.modifiedAt).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                                    {(file._calcFinalTotal ?? file.finalTotal)?.toLocaleString()}원
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="견적서 불러오기">
                                    <IconButton 
                                        size="small"
                                        onClick={async () => {
                                            let full = file;
                                            if (full.fileName) {
                                                try {
                                                    const res = await fetchQuote(full.fileName);
                                                    full = res.data || res;
                                                } catch (e) {
                                                    console.error('견적서 상세를 불러오지 못했습니다.', e);
                                                }
                                            }
                                            onLoadEstimate(full);
                                        }}
                                    >
                                        <DescriptionIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="견적서 삭제">
                                    <IconButton 
                                        size="small"
                                        onClick={() => setDeleteDialog({ 
                                            open: true, 
                                            fileName: file.fileName 
                                        })}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </ListItem>
                ))}
            </List>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <Box sx={{ 
                    p: 1.5, 
                    borderTop: '1px solid #f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {page * itemsPerPage + 1}-{Math.min((page + 1) * itemsPerPage, filteredFiles.length)} / {filteredFiles.length}개
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                            sx={{ 
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.75rem',
                                height: '28px'
                            }}
                        >
                            이전
                        </Button>
                        <Typography variant="caption" sx={{ px: 0.5, fontSize: '0.75rem' }}>
                            {page + 1} / {totalPages}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                            sx={{ 
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.75rem',
                                height: '28px'
                            }}
                        >
                            다음
                        </Button>
                    </Box>
                </Box>
            )}

            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, fileName: null })}
                PaperProps={{
                    sx: {
                        width: '400px',
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    p: 3,
                    pb: 2
                }}>
                    견적서 삭제
                </DialogTitle>
                <DialogContent sx={{ 
                    p: 3,
                    pt: 2,
                    pb: 2
                }}>
                    <Typography>
                        이 견적서를 삭제하시겠습니까?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ 
                    p: 3,
                    pt: 2
                }}>
                    <Button 
                        onClick={() => setDeleteDialog({ open: false, fileName: null })}
                        sx={{
                            px: 3
                        }}
                    >
                        취소
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        variant="contained"
                        sx={{
                            px: 3
                        }}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
});

export default RecentEstimates; 