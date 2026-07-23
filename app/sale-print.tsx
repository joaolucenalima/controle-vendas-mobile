import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { formatSaleToPrint } from "@/features/printer/format-sale-to-print";
import { usePrinterStore } from "@/features/printer/printer-store";
import { usePrinter } from "@/features/printer/use-printer";
import { useSaleStore } from "@/features/sales/sale-store";
import type { SaleWithItems } from "@/features/sales/sale.types";
import { Button, DatePickerField, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import {
  dateFilterKeyToSoldAtIso,
  formatDateFilterDisplay,
  formatDateToDisplay,
} from "@/shared/utils/format-date";
import { parseRouteId } from "@/shared/utils/parse-route-id";

export default function SalePrintScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const parsedId = parseRouteId(id);
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customPrintDate, setCustomPrintDate] = useState("");

  const { getSaleById } = useSaleStore();
  const { receiptTitle, loadReceiptTitle } = usePrinterStore();
  const { print, status } = usePrinter();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadSale() {
        setSale(null);
        setErrorMessage(null);

        if (!parsedId) {
          setErrorMessage("A venda informada é inválida ou não foi selecionada.");
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          const [loadedSale] = await Promise.all([getSaleById(parsedId), loadReceiptTitle()]);

          if (isMounted) {
            setSale(loadedSale);
            setCustomPrintDate(loadedSale.sold_at.split("T")[0]);
          }
        } catch (error: unknown) {
          if (isMounted) {
            setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar a venda");
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }

      loadSale();
      return () => {
        isMounted = false;
      };
    }, [getSaleById, loadReceiptTitle, parsedId]),
  );

  function printSale() {
    if (!sale) return;

    print(
      formatSaleToPrint({
        ...sale,
        sold_at: customPrintDate ? dateFilterKeyToSoldAtIso(customPrintDate) : sale.sold_at,
      }),
    );
  }

  const statusTextMap = {
    idle: "Imprimir venda",
    connecting: "Conectando à impressora...",
    printing: "Imprimindo...",
    success: "Venda impressa com sucesso!",
    error: "Erro ao imprimir. Verifique a conexão.",
  } as const;

  return (
    <StackFormWrapper title={sale ? `Imprimir venda #${sale.id}` : "Imprimir venda"}>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.tint} />
          <ThemedText style={styles.loadingText}>Carregando detalhes da venda...</ThemedText>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorCard}>
          <ThemedText style={styles.errorTitle}>Não foi possível abrir a venda</ThemedText>
          <ThemedText style={styles.errorDescription}>{errorMessage}</ThemedText>
          <Button label="Voltar para vendas" onPress={() => router.replace("/sales")} size="md" />
        </View>
      ) : sale ? (
        <>
          <View style={styles.introCard}>
            <View>
              <ThemedText style={styles.saleLabel}>VENDA #{sale.id}</ThemedText>
              <ThemedText style={styles.saleDate}>{formatDateToDisplay(sale.sold_at)}</ThemedText>
            </View>
            <ThemedText style={styles.saleTotal}>
              {formatCentsToCurrency(sale.total_in_cents)}
            </ThemedText>
          </View>

          <DatePickerField
            label="Data para impressão (opcional)"
            value={customPrintDate}
            onChange={setCustomPrintDate}
          />

          <View style={styles.receiptCard}>
            <ThemedText style={styles.previewLabel}>PRÉVIA DO RECIBO</ThemedText>
            {receiptTitle ? (
              <ThemedText style={styles.receiptTitle}>{receiptTitle}</ThemedText>
            ) : null}
            <ThemedText style={styles.receiptDate}>
              Data da venda: {customPrintDate
                ? formatDateFilterDisplay(customPrintDate)
                : formatDateToDisplay(sale.sold_at)}
            </ThemedText>

            <View style={styles.separator} />

            {sale.items.length ? (
              <View style={styles.itemsList}>
                {sale.items.map((item, index) => (
                  <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemBorder]}>
                    <View style={styles.itemContent}>
                      <ThemedText style={styles.itemName}>{item.product_name}</ThemedText>
                      <ThemedText style={styles.itemMeta}>
                        Qtd. {item.quantity} · {formatCentsToCurrency(item.unit_price_in_cents)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.itemSubtotal}>
                      {formatCentsToCurrency(item.subtotal_in_cents)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.emptyItems}>Nenhum item para exibir.</ThemedText>
            )}

            <View style={styles.separator} />
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalText}>Total</ThemedText>
              <ThemedText style={styles.totalText}>
                {formatCentsToCurrency(sale.total_in_cents)}
              </ThemedText>
            </View>
          </View>

          <Button
            label={statusTextMap[status]}
            onPress={printSale}
            disabled={status !== "idle"}
            size="md"
          />
        </>
      ) : null}
    </StackFormWrapper>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    loadingState: {
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingVertical: 72,
    },
    loadingText: { color: colors.textMuted, fontFamily: fonts.sans },
    errorCard: {
      padding: 20,
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    errorTitle: { fontSize: 18, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
    errorDescription: { color: colors.textMuted, fontFamily: fonts.sans, lineHeight: 20 },
    introCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.tintSoft,
    },
    saleLabel: { fontSize: 12, fontWeight: "700", color: colors.tint, fontFamily: fonts.rounded },
    saleDate: { marginTop: 5, fontSize: 14, color: colors.textMuted, fontFamily: fonts.sans },
    saleTotal: { fontSize: 20, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
    receiptCard: {
      padding: 16,
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    previewLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    receiptTitle: { textAlign: "center", fontSize: 18, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
    receiptDate: { textAlign: "center", fontSize: 14, color: colors.textMuted, fontFamily: fonts.sans },
    separator: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
    itemsList: { gap: 0 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    itemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    itemContent: { flex: 1, gap: 4 },
    itemName: { fontSize: 15, fontWeight: "600", color: colors.text, fontFamily: fonts.rounded },
    itemMeta: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.sans },
    itemSubtotal: { fontSize: 14, fontWeight: "600", color: colors.text, fontFamily: fonts.rounded },
    emptyItems: { paddingVertical: 12, color: colors.textMuted, fontFamily: fonts.sans },
    totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    totalText: { fontSize: 17, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
  });
