import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { GOOGLE_CONFIG } from "@/shared/config/google";

const GOOGLE_DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.appdata"];

GoogleSignin.configure({
  scopes: GOOGLE_DRIVE_SCOPES,
  webClientId: GOOGLE_CONFIG.webClientId,
  iosClientId: GOOGLE_CONFIG.iosClientId,
  offlineAccess: false,
});

type GoogleUser = {
  email: string;
  name: string;
};

export class GoogleLoginCancelledError extends Error {}

function hasPlatformClientId() {
  if (Platform.OS === "android") {
    return Boolean(GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.webClientId);
  }
  if (Platform.OS === "ios") return Boolean(GOOGLE_CONFIG.iosClientId);
  return false;
}

function mapUser(user: User): GoogleUser {
  return {
    email: user.user.email,
    name: user.user.name ?? user.user.email ?? "Conta Google",
  };
}

export function useGoogleDriveLogin() {
  const isConfigured = hasPlatformClientId();
  const currentUser = GoogleSignin.getCurrentUser();
  const [user, setUser] = useState<GoogleUser | null>(
    currentUser ? mapUser(currentUser) : null,
  );

  const disconnect = useCallback(() => {
    setUser(null);
  }, []);

  const getAccessToken = useCallback(
    async (forceLogin = false) => {
      if (!isConfigured) {
        throw new Error("Configure o cliente OAuth do Google para usar o backup.");
      }

      try {
        if (Platform.OS === "android") {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }

        if (forceLogin) {
          await GoogleSignin.signOut();
        }

        let signedUser = GoogleSignin.getCurrentUser();

        if (!signedUser && !forceLogin && GoogleSignin.hasPreviousSignIn()) {
          const silentResult = await GoogleSignin.signInSilently();
          if (silentResult.type === "success") signedUser = silentResult.data;
        }

        if (!signedUser) {
          const result = await GoogleSignin.signIn();
          if (result.type === "cancelled") {
            throw new GoogleLoginCancelledError("Login cancelado.");
          }
          signedUser = result.data;
        }

        setUser(mapUser(signedUser));
        const tokens = await GoogleSignin.getTokens();
        if (!tokens.accessToken) {
          throw new Error("O Google não retornou autorização para acessar o Drive.");
        }

        return tokens.accessToken;
      } catch (error) {
        if (
          error instanceof GoogleLoginCancelledError ||
          (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED)
        ) {
          throw new GoogleLoginCancelledError("Login cancelado.");
        }
        if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error("O Google Play Services não está disponível ou precisa ser atualizado.");
        }
        if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
          throw new Error("Já existe um login Google em andamento.");
        }
        throw error;
      }
    },
    [isConfigured],
  );

  return {
    isConfigured,
    isConnected: user !== null,
    user,
    getAccessToken,
    disconnect,
  };
}
