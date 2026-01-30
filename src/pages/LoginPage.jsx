import { useState } from 'react';
import { Box, Snackbar, FormControlLabel, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoginActive, setIsLoginActive] = useState(true);
  const storedName = localStorage.getItem('remember_username') || '';
  const [username, setUsername] = useState(storedName);
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });
  const [autoLogin, setAutoLogin] = useState(false);
  const [rememberId, setRememberId] = useState(!!storedName);

  const handleLogin = async () => {
    if (!username || !password) {
      setSnackbar({ open: true, msg: '아이디와 비밀번호를 입력하세요.', severity: 'warning' });
      return;
    }
    try {
      await api.post('/login', { username, password, autoLogin });
      if (rememberId) {
        localStorage.setItem('remember_username', username);
      } else {
        localStorage.removeItem('remember_username');
      }
      navigate('/');
    } catch {
      setSnackbar({ open: true, msg: '로그인 실패: 아이디 또는 비밀번호를 확인하세요.', severity: 'error' });
    }
  };

  const handleSignupClick = () => {
    setSnackbar({ open: true, msg: '회원가입 기능은 준비 중입니다.', severity: 'info' });
  };

  return (
    <Box className="login-page" sx={{ width: '100%' }}>
      <div className="form-structor">
        {/* Sign up section */}
        <div className={"signup" + (isLoginActive ? ' slide-up' : '')}>
          <h2 className="form-title" id="signup" onClick={() => setIsLoginActive(false)}>
            <span>or</span>Sign up
          </h2>
          <div className="form-holder">
            <input type="text" className="input" placeholder="Name" disabled />
            <input type="email" className="input" placeholder="Email" disabled />
            <input type="password" className="input" placeholder="Password" disabled />
          </div>
          <button className="submit-btn" onClick={handleSignupClick} disabled>Sign up</button>
        </div>

        {/* Log in section */}
        <div className={"login" + (isLoginActive ? '' : ' slide-up')}> 
          <div className="center">
            <h2 className="form-title" id="login" onClick={() => setIsLoginActive(true)}>
              <span>or</span>Log in
            </h2>
            <form onSubmit={(e)=>{e.preventDefault(); handleLogin();}}>
              <div className="form-holder">
                <input
                  type="text"
                  className="input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="auto-login">
                <FormControlLabel
                  control={<Checkbox checked={autoLogin} onChange={(e)=> setAutoLogin(e.target.checked)} size="small" />}
                  label={<span style={{ fontSize:'12px' }}>자동 로그인</span>} 
                  sx={{ mt:1 }}
                />
                <FormControlLabel
                  control={<Checkbox checked={rememberId} onChange={(e)=> setRememberId(e.target.checked)} size="small" />}
                  label={<span style={{ fontSize:'12px' }}>아이디 저장</span>}
                  sx={{ mt:1 }}
                />
              </div>
              <button type="submit" className="submit-btn">Log in</button>
            </form>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.msg}
      />
    </Box>
  );
} 