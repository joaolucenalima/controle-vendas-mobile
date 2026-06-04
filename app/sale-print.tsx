import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";

import { usePrinterStore } from "@/features/printer/printer-store";
import { useProductStore } from "@/features/products/product-store";
import { useSaleStore } from "@/features/sales/sale-store";
import type { Sale, SaleWithItems } from "@/features/sales/sale.types";
import { Button, IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { formatDateToDisplay } from "@/shared/utils/format-date-filter";
import { BLEPrinter, IBLEPrinter } from "react-native-ect-thermal-receipt-printer";

export default function SalePrintScreen() {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<SaleWithItems | null>(null);
  const [connectedPrinter, setConnectedPrinter] = useState<IBLEPrinter | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { sales, loadSales, getSaleById } = useSaleStore();
  const { products, loadProducts } = useProductStore();
  const { loadMacAddress } = usePrinterStore();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function fetchSales() {
        try {
          setIsLoading(true);
          await Promise.all([loadSales(), loadProducts()]);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Falha ao carregar vendas";
          if (isMounted) {
            Alert.alert("Erro", message);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      fetchSales();

      return () => {
        isMounted = false;
      };
    }, [loadProducts, loadSales]),
  );

  useEffect(() => {
    if (!selectedSaleId) {
      setSelectedSaleDetails(null);
      return;
    }

    const stillExists = sales.some((sale) => sale.id === selectedSaleId);
    if (!stillExists) {
      setSelectedSaleId(null);
      setSelectedSaleDetails(null);
    }
  }, [sales, selectedSaleId]);

  useEffect(() => {
    loadMacAddress().then((macAddress) => {
      BLEPrinter.init()
        .then(() => BLEPrinter.getDeviceList())
        .then((printers) =>
          setConnectedPrinter(printers.find((printer) => printer.inner_mac_address === macAddress)),
        );
    });
  }, []);

  const productNamesById = useMemo(() => {
    return products.reduce<Record<number, string>>((accumulator, product) => {
      accumulator[product.id] = product.name;
      return accumulator;
    }, {});
  }, [products]);

  async function handleSelectSale(saleId: number) {
    setSelectedSaleId(saleId);
    setSelectedSaleDetails(null);

    try {
      setIsLoadingDetails(true);
      const details = await getSaleById(saleId);
      setSelectedSaleDetails(details);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao carregar itens";
      Alert.alert("Erro", message);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function renderSaleCard(sale: Sale) {
    const isSelected = sale.id === selectedSaleId;

    return (
      <Pressable
        key={sale.id}
        accessibilityRole="button"
        onPress={() => handleSelectSale(sale.id)}
        style={({ pressed }) => [
          styles.saleCard,
          isSelected && styles.saleCardSelected,
          pressed && styles.saleCardPressed,
        ]}
      >
        <View style={styles.saleMeta}>
          {isSelected ? (
            <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.tint} />
          ) : (
            <IconSymbol name="circle" size={18} color={theme.colors.textMuted} />
          )}

          <View>
            <ThemedText style={styles.saleId}>Venda #{sale.id}</ThemedText>
            <ThemedText style={styles.saleDate}>{formatDateToDisplay(sale.sold_at)}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.saleTotal}>
          {formatCentsToCurrency(sale.total_in_cents)}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <StackFormWrapper title="Impressão de Venda">
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Selecione a venda</ThemedText>
        <ThemedText style={styles.cardDescription}>
          Escolha uma venda para enviar para a impressora térmica.
        </ThemedText>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.tint} />
            <ThemedText style={styles.loadingText}>Carregando vendas...</ThemedText>
          </View>
        ) : sales.length ? (
          <View style={styles.saleList}>{sales.map(renderSaleCard)}</View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Nenhuma venda encontrada</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Registre uma venda para habilitar a impressão.
            </ThemedText>
          </View>
        )}
      </View>

      {selectedSaleDetails && (
        <View style={styles.saleDetailsCard}>
          <ThemedText style={styles.saleDetailsTitle}>
            Venda do dia {formatDateToDisplay(selectedSaleDetails.sold_at)}
          </ThemedText>

          {isLoadingDetails ? (
            <View style={styles.itemsLoadingWrap}>
              <ActivityIndicator color={theme.colors.tint} />
              <ThemedText style={styles.itemsLoadingText}>Carregando itens...</ThemedText>
            </View>
          ) : selectedSaleDetails?.items.length ? (
            <View style={styles.itemsList}>
              {selectedSaleDetails.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.itemName}>
                      {productNamesById[item.product_id] ?? `Produto #${item.product_id}`}
                    </ThemedText>
                    <ThemedText style={styles.itemMeta}>
                      Qtd. {item.quantity} - {formatCentsToCurrency(item.unit_price_in_cents)}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.itemSubtotal}>
                    {formatCentsToCurrency(item.subtotal_in_cents)}
                  </ThemedText>
                </View>
              ))}

              <View style={styles.totalSeparator} />

              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.itemName}>Total</ThemedText>
                </View>

                <ThemedText style={styles.itemSubtotal}>
                  {formatCentsToCurrency(selectedSaleDetails.total_in_cents)}
                </ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText style={styles.itemsEmpty}>Nenhum item para exibir.</ThemedText>
          )}
        </View>
      )}

      <Button
        label="Imprimir venda"
        onPress={() => Alert.alert("Em desenvolvimento", "A impressão será implementada em breve.")}
        disabled={!selectedSaleDetails}
        size="md"
      />
    </StackFormWrapper>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      color: colors.text,
    },
    cardDescription: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    saleList: {
      gap: 10,
    },
    saleCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    saleCardSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.surfaceElevated,
    },
    saleCardPressed: {
      opacity: 0.85,
    },
    saleDate: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    saleTotal: {
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    saleMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    saleId: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.sans,
    },
    saleDetailsCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
    },
    saleDetailsTitle: {
      fontSize: 16,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      color: colors.text,
    },
    itemsList: {
      gap: 12,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    itemName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    itemMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    itemSubtotal: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "500",
    },
    totalSeparator: {
      height: 1,
      backgroundColor: colors.textMuted,
      marginVertical: 4,
    },
    itemsEmpty: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    itemsLoadingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    itemsLoadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    emptyState: {
      paddingVertical: 24,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      textAlign: "center",
    },
    loadingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
  });

