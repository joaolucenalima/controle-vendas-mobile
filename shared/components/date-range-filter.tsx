import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { parseDateFilterKey } from "@/shared/utils/format-date-filter";
import { Button } from "./button";
import { DatePickerField } from "./date-picker-field";
import ThemedText from "./themed-text";

export type DateRangeFilterValue = {
  initialDate: string;
  finalDate: string;
};

type DateRangeFilterProps = {
  value: DateRangeFilterValue;
  onApply: (value: DateRangeFilterValue) => void | Promise<void>;
  onClear: () => void | Promise<void>;
};

export const emptyDateRangeFilter: DateRangeFilterValue = {
  initialDate: "",
  finalDate: "",
};

export function getDateRangeFilterParams(value: DateRangeFilterValue) {
  const initialDate = value.initialDate || undefined;
  const finalDate = value.finalDate || undefined;

  if (!initialDate && !finalDate) return undefined;

  return { initialDate, finalDate };
}

export function DateRangeFilter({ value, onApply, onClear }: DateRangeFilterProps) {
  const styles = useStyles(createStyles);
  const [draftValue, setDraftValue] = useState(value);
  const initialDateLimit = parseDateFilterKey(draftValue.finalDate) ?? undefined;
  const finalDateLimit = parseDateFilterKey(draftValue.initialDate) ?? undefined;

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  function handleInitialDateChange(initialDate: string) {
    setDraftValue((current) => ({ ...current, initialDate }));
  }

  function handleFinalDateChange(finalDate: string) {
    setDraftValue((current) => ({ ...current, finalDate }));
  }

  function handleApply() {
    if (
      draftValue.initialDate &&
      draftValue.finalDate &&
      draftValue.initialDate > draftValue.finalDate
    ) {
      Alert.alert("Erro", "A data inicial deve ser menor ou igual a data final");
      return;
    }

    onApply(draftValue);
  }

  function handleClear() {
    setDraftValue(emptyDateRangeFilter);
    onClear();
  }

  return (
    <View style={styles.filterCard}>
      <ThemedText style={styles.filterTitle}>Filtrar por período</ThemedText>

      <View style={styles.filterInputs}>
        <DatePickerField
          label="Inicial"
          value={draftValue.initialDate}
          onChange={handleInitialDateChange}
          placeholder="Data inicial"
          maximumDate={initialDateLimit}
        />

        <DatePickerField
          label="Final"
          value={draftValue.finalDate}
          onChange={handleFinalDateChange}
          placeholder="Data final"
          minimumDate={finalDateLimit}
        />
      </View>

      <View style={styles.filterActions}>
        <Button label="Filtrar" onPress={handleApply} size="sm" fullWidth={false} flex />

        <Button
          label="Limpar"
          onPress={handleClear}
          variant="secondary"
          size="sm"
          fullWidth={false}
          flex
        />
      </View>
    </View>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    filterCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 8,
    },
    filterTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "semibold",
    },
    filterInputs: {
      flexDirection: "row",
      gap: 12,
    },
    filterActions: {
      flexDirection: "row",
      gap: 10,
    },
  });

