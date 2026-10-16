import React, { useCallback, useMemo } from 'react';
import {
  useGetCurrentUser,
  useLoginWithToken,
  useLogoutCurrentUser,
  UserInterface,
} from '../hooks/user';
import { GrantType, TokenType } from '../types/api/control.gen';
import { useNotification } from '../utils/NotificationContext';
import { getUserManager } from './oidc';
import { getConfig } from '../config';

interface AuthContextProps {
  currentUser: UserInterface | null;
  loginWithOidc: () => void;
  loginWithToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  authEnabled: boolean;
}

const AuthContext = React.createContext<AuthContextProps>({
  currentUser: null,
  loginWithOidc: () => {},
  loginWithToken: async () => {},
  logout: async () => {},
  authEnabled: false,
});
AuthContext.displayName = 'AuthContext';

function AuthProvider(props: any) {
  const { data: currentUser, refetch } = useGetCurrentUser();
  const loginWithTokenMutation = useLoginWithToken();
  const logoutUser = useLogoutCurrentUser();
  const { setNotification } = useNotification();
  const authEnabled = getConfig().authEnabled;

  const loginWithOidc = useCallback(async () => {
    const userManager = await getUserManager();
    userManager.signinRedirect();
  }, []);

  const loginWithToken = useCallback(
    async (idToken: string) => {
      try {
        await loginWithTokenMutation.mutateAsync({
          grant_type: GrantType.TOKEN_EXCHANGE,
          requested_token_type: TokenType.ACCESS_TOKEN,
          subject_token_type: TokenType.ID_TOKEN,
          subject_token: idToken,
        });
        await refetch();
      } catch {
        setNotification(
          'Login failed. Please contact your system administrator.',
          'error',
        );
      }
    },
    [loginWithTokenMutation, setNotification, refetch],
  );

  const logout = useCallback(async () => {
    return logoutUser.mutate(
      {},
      {
        onSuccess: async () => {
          refetch();
          if (authEnabled) {
            try {
              const userManager = await getUserManager();
              userManager.removeUser();
            } catch {
              // OIDC cleanup is best-effort
            }
          }
        },
        onError: () => {
          setNotification(
            'Logout failed. Please contact your system administrator.',
            'error',
          );
        },
      },
    );
  }, [refetch, logoutUser, setNotification, authEnabled]);

  const value = useMemo(
    () => ({
      loginWithOidc,
      loginWithToken,
      logout,
      currentUser,
      authEnabled,
    }),
    [loginWithOidc, loginWithToken, logout, currentUser, authEnabled],
  );

  return <AuthContext.Provider value={value} {...props} />;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }
  return context;
}

export { AuthProvider, useAuth };
