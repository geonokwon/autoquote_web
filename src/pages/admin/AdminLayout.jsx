import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, IconButton, useTheme, useMediaQuery, Drawer, Divider } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Home as HomeIcon } from '@mui/icons-material';

export default function AdminLayout() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarWidth = 220;
  const [open, setOpen] = useState(true);

  const contentRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);

  const handleContentScroll = () => {
    if (contentRef.current) {
      const sl = contentRef.current.scrollLeft;
      setScrolled(sl > 20);
    }
  };

  // auto-collapse on small screens / auto-open on wide screens
  useEffect(() => {
    setOpen(!isSmall);
  }, [isSmall]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', position:'relative' }}>
      {/* Side menu */}
      <Drawer
        variant={isSmall ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open ? sidebarWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            bgcolor: '#f5f5f5',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          },
        }}
      >
        <Button component={Link} to="services" variant="contained" color="primary">
          서비스 관리
        </Button>
        <Button component={Link} to="combo" variant="contained" color="primary">
          결합 할인 규칙
        </Button>
        <Button component={Link} to="product-benefits" variant="contained" color="primary">
          기본 혜택
        </Button>
        <Button component={Link} to="benefit-rules" variant="contained" color="primary">
          결합 혜택
        </Button>
        <Button component={Link} to="bundle-benefits" variant="contained" color="primary">
          묶음 혜택
        </Button>
        <Button component={Link} to="settings" variant="contained" color="primary">
          설정
        </Button>

        <Divider sx={{ my: 1 }} />
        <Button startIcon={<HomeIcon />} component={Link} to="/" variant="outlined" color="primary">
          메인 화면
        </Button>
      </Drawer>
      {/* Main content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }} ref={contentRef} onScroll={handleContentScroll}>
        <Outlet />
      </Box>

      {/* Toggle button */}
      <IconButton
        onClick={() => setOpen((o) => !o)}
        sx={{
          position: 'fixed',
          top: 60,
          left: scrolled ? -60 : (open ? `${sidebarWidth + 10}px` : 10),
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          border: '1px solid #ccc',
          boxShadow: 1,
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? 'none' : 'auto',
          transition: 'left 0.3s, opacity 0.3s',
        }}
      >
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
    </Box>
  );
} 