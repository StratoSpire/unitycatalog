import { Button, Flex, Layout, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/auth-context';

export default function LoginPage() {
  const { loginWithOidc } = useAuth();

  return (
    <Layout
      hasSider={false}
      style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(#131D35,#252342,#1E2E3A)',
      }}
    >
      <Flex
        vertical={true}
        align={'center'}
        justify={'center'}
        gap={'middle'}
        style={{ height: '100%', width: '100%' }}
      >
        <div>
          <img
            src="/uc-logo-horiz-reverse.svg"
            height={32}
            alt="uc-logo-horizontal"
          />
        </div>
        <div
          style={{
            height: 200,
            width: 400,
            backgroundColor: '#F6F7F9',
            borderRadius: '16px',
          }}
        >
          <Flex
            vertical={true}
            align={'center'}
            justify={'center'}
            gap={'middle'}
            style={{ padding: 24, height: '100%' }}
          >
            <Typography.Title level={4}>
              Login to Unity Catalog
            </Typography.Title>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={loginWithOidc}
              style={{ width: 240 }}
            >
              Sign in with SSO
            </Button>
          </Flex>
        </div>
      </Flex>
    </Layout>
  );
}
