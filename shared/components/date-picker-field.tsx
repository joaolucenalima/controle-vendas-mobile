import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  formatDateFilterDisplay,
  formatDateFilterKey,
  parseDateFilterKey,
} from "@/shared/utils/format-date-filter";

type DatePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Selecionar data",
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseDateFilterKey(value) ?? new Date());

  const displayValue = useMemo(() => formatDateFilterDisplay(value), [value]);
  const hasValue = value.length > 0;

  function openPicker() {
    setDraftDate(parseDateFilterKey(value) ?? new Date());
    setVisible(true);
  }

  function closePicker() {
    setVisible(false);
  }

  function applyDate(date: Date) {
    onChange(formatDateFilterKey(date));
    closePicker();
  }

  function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
    closePicker();

    if (event.type === "dismissed" || !date) return;
    applyDate(date);
  }

  function handleIosConfirm() {
    applyDate(draftDate);
  }

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayValue || placeholder}`}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <Text style={[styles.triggerText, !hasValue && styles.placeholder]}>
          {hasValue ? displayValue : placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "android" && visible ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={closePicker}>
          <Pressable style={styles.overlay} onPress={closePicker} accessibilityRole="button" />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={closePicker} hitSlop={8}>
                <Text style={styles.sheetActionMuted}>Cancelar</Text>
              </Pressable>

              <Text style={styles.sheetTitle}>{label}</Text>

              <Pressable onPress={handleIosConfirm} hitSlop={8}>
                <Text style={styles.sheetAction}>Confirmar</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="pt-BR"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, date) => {
                if (date) setDraftDate(date);
              }}
              textColor={theme.colors.text}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    field: {
      flex: 1,
      gap: 6,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    trigger: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 46,
      justifyContent: "center",
    },
    triggerPressed: {
      opacity: 0.88,
    },
    triggerText: {
      color: colors.text,
      fontFamily: fonts.sans,
      fontSize: 14,
    },
    placeholder: {
      color: colors.textMuted,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetTitle: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 15,
    },
    sheetAction: {
      color: colors.tint,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 15,
    },
    sheetActionMuted: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontSize: 15,
    },
  });

