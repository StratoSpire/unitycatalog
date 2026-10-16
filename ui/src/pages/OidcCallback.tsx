import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { getUserManager } from '../context/oidc';
import { useAuth } from '../context/auth-context';

export default function OidcCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    getUserManager()
      .then((userManager) => userManager.signinRedirectCallback())
      .then((user) => {
        if (user?.id_token) {
          return loginWithToken(user.id_token);
        }
        throw new Error('No ID token received from OIDC provider');
      })
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch((err) => {
        console.error('OIDC callback error:', err);
        navigate('/', { replace: true });
      });
  }, [loginWithToken, navigate]);

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{ height: '100vh', width: '100vw' }}
    >
      <Spin size="large" />
      <Typography.Text style={{ marginTop: 16 }}>
        Completing sign in...
      </Typography.Text>
    </Flex>
  );
}
