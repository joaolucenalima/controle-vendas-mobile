import type { User } from "@react-native-google-signin/google-signin";
import { useCallback, useState } from "react";
import { Platform, TurboModuleRegistry } from "react-native";

import { GOOGLE_CONFIG } from "@/shared/config/google";

const GOOGLE_DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.appdata"];

// Importing the package enforces native module availability, even before login.
const googleSignIn =
  (Platform.OS === "android" || Platform.OS === "ios") &&
  TurboModuleRegistry.get("RNGoogleSignin") !== null
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Must check the native module before evaluating the package.
    ? (require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin"))
    : null;

googleSignIn?.GoogleSignin.configure({
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
  const isAvailable = googleSignIn !== null;
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const currentUser = googleSignIn?.GoogleSignin.getCurrentUser();
    return currentUser ? mapUser(currentUser) : null;
  });

  const disconnect = useCallback(() => {
    setUser(null);
  }, []);

  const getAccessToken = useCallback(
    async (forceLogin = false) => {
      if (!googleSignIn) {
        throw new Error("O login Google não está disponível nesta versão do aplicativo. Instale uma versão com suporte ao Google Drive.");
      }
      if (!isConfigured) {
        throw new Error("Configure o cliente OAuth do Google para usar o backup.");
      }

      const { GoogleSignin, isErrorWithCode, statusCodes } = googleSignIn;
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
    isAvailable,
    isConfigured,
    isConnected: user !== null,
    user,
    getAccessToken,
    disconnect,
  };
}
