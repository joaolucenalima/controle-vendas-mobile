import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";

type TabsScreenLayoutProps = PropsWithChildren;

export function TabsScreenLayout({ children }: TabsScreenLayoutProps) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
        <View style={styles.orbRing} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const createStyles = ({ colors }: StylesProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    backgroundArt: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    orbLarge: {
      position: "absolute",
      width: 320,
      height: 320,
      borderRadius: 160,
      top: -140,
      right: -90,
      opacity: 0.65,
      backgroundColor: colors.tintSoft,
    },
    orbSmall: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      bottom: 80,
      left: -60,
      opacity: 0.45,
      backgroundColor: colors.surface,
    },
    orbRing: {
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      borderWidth: 2,
      top: 160,
      left: 30,
      opacity: 0.25,
      borderColor: colors.border,
    },
  });
