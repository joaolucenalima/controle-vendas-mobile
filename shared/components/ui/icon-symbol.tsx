// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "chart.bar.fill": "show-chart",
  "cart.fill": "shopping-cart",
  "banknote.fill": "payments",
  "circle.grid.2x2.fill": "dashboard",
  dollarsign: "point-of-sale",
  "shippingbox.fill": "inventory-2",
  "wallet.pass.fill": "payments",
  "archivebox.fill": "warehouse",
  plus: "add",
  minus: "remove",
  trash: "delete",
  xmark: "close",
  magnifyingglass: "search",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "camera.fill": "camera-alt",
  "gearshape.fill": "settings",
  "printer.fill.and.paper.fill": "print",
  printer: "print",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
