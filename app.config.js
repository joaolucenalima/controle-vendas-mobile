module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId) {
    const iosClientSuffix = ".apps.googleusercontent.com";
    const reversedClientId = iosClientId.endsWith(iosClientSuffix)
      ? iosClientId.slice(0, -iosClientSuffix.length)
      : iosClientId;

    plugins.push([
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: `com.googleusercontent.apps.${reversedClientId}`,
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};

