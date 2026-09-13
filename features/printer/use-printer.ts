import { usePrinterStore } from "./printer-store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export function usePrinter() {
  const print = usePrinterStore(state => state.print);
  const status = usePrinterStore(state => state.printStatus);
  const resetPrintResult = usePrinterStore(state => state.resetPrintResult);
  useFocusEffect(useCallback(() => { resetPrintResult(); }, [resetPrintResult]));
  return { print, status };
}
