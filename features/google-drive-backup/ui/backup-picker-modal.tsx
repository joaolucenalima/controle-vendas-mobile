import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import type { DriveBackupFile } from "../backup.types";

type BackupPickerModalProps = {
  visible: boolean;
  backups: DriveBackupFile[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelect: (backup: DriveBackupFile) => void;
  onClose: () => void;
};

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBackupDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BackupPickerModal({
  visible,
  backups,
  isLoading,
  onRefresh,
  onSelect,
  onClose,
}: BackupPickerModalProps) {
  const styles = useStyles(createStyles);
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Restaurar backup</ThemedText>
            <ThemedText style={styles.subtitle}>Escolha um snapshot do Google Drive</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <IconSymbol name="xmark" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={backups}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={onRefresh}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <IconSymbol
                    name="icloud.and.arrow.up.fill"
                    size={26}
                    color={theme.colors.textMuted}
                  />
                </View>
                <ThemedText style={styles.emptyTitle}>Nenhum backup encontrado</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Crie um backup para que ele apareça nesta lista.
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Restaurar backup de ${formatBackupDate(item.createdTime)}`}
              onPress={() => onSelect(item)}
              style={({ pressed }) => [styles.backupCard, pressed && styles.pressed]}
            >
              <View style={styles.fileIcon}>
                <IconSymbol name="icloud.and.arrow.up.fill" size={22} color={theme.colors.tint} />
              </View>
              <View style={styles.backupContent}>
                <ThemedText style={styles.backupDate}>
                  {formatBackupDate(item.createdTime)}
                </ThemedText>
                <ThemedText style={styles.backupMeta}>
                  {formatSize(item.size)} · Formato v{item.formatVersion}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.left" size={20} color={theme.colors.textMuted} style={styles.chevron} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerText: { flex: 1, gap: 4 },
    title: { fontSize: 22, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
    subtitle: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.sans },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    list: { padding: 20, gap: 10, flexGrow: 1 },
    backupCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    fileIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.tintSoft,
    },
    backupContent: { flex: 1, gap: 4 },
    backupDate: { fontSize: 15, fontWeight: "600", color: colors.text, fontFamily: fonts.rounded },
    backupMeta: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.sans },
    chevron: { transform: [{ rotate: "180deg" }] },
    pressed: { opacity: 0.78 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.text, fontFamily: fonts.rounded },
    emptyText: { color: colors.textMuted, textAlign: "center", fontFamily: fonts.sans },
  });

