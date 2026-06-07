import { SaleWithItems } from "@/features/sales/sale.types";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { formatDateToDisplay } from "@/shared/utils/format-date";

// Comandos ESC/POS reais
const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  INIT: ESC + "@", // reset geral
  ALIGN_LEFT: ESC + "a\x00",
  ALIGN_CENTER: ESC + "a\x01",
  ALIGN_RIGHT: ESC + "a\x02",
  BOLD_ON: ESC + "E\x01",
  BOLD_OFF: ESC + "E\x00",
  FONT_NORMAL: GS + "!\x00", // tamanho 1x1
  FONT_DOUBLE_HEIGHT: GS + "!\x01", // altura 2x
  FONT_DOUBLE: GS + "!\x11", // largura 2x, altura 2x
  FEED: "\n",
  CUT_FULL: GS + "V\x00", // corte total
  CUT_FEED_FULL: GS + "V\x41\x00", // avanço e corte total
} as const;

const LINE_WIDTH = 32;
const SEPARATOR = "=".repeat(LINE_WIDTH);
const TABLE_COLUMNS_LENGTH = [4, 17, 9];
const TABLE_COLUMNS_ALIGNMENT: ("left" | "right")[] = ["left", "left", "right"];

function wrapText(text: string, maxLength: number): string[] {
  const lines: string[] = [];

  while (text.length > maxLength) {
    let breakPoint = text.lastIndexOf(" ", maxLength);
    if (breakPoint <= 0) breakPoint = maxLength;
    lines.push(text.slice(0, breakPoint).trimEnd());
    text = text.slice(breakPoint).trimStart();
  }

  if (text.length > 0) lines.push(text);
  return lines;
}

function formatTableCell(
  text: string,
  maxLength: number,
  alignment: "left" | "right" = "left",
): string {
  const spacesCount = Math.max(0, maxLength - text.length);
  return alignment === "left" ? text + " ".repeat(spacesCount) : " ".repeat(spacesCount) + text;
}

function formatTableLine(texts: string[]) {
  const wrappedCells = texts.map((text, index) =>
    wrapText(text, TABLE_COLUMNS_LENGTH[index] ?? 16),
  );

  const totalLines = Math.max(...wrappedCells.map((cell) => cell.length));
  const lines: string[] = [];

  for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
    const rowParts = wrappedCells.map((cellLines, colIndex) => {
      const maxLength = TABLE_COLUMNS_LENGTH[colIndex] ?? 16;
      const alignment = TABLE_COLUMNS_ALIGNMENT[colIndex] ?? "left";
      const content = cellLines[lineIndex] ?? "";
      return formatTableCell(content, maxLength, alignment);
    });
    lines.push(rowParts.join(" "));
  }

  return lines.join(CMD.FEED);
}

export function formatSaleToPrint(sale: SaleWithItems): string {
  const date = formatDateToDisplay(sale.sold_at);
  const formattedTotal = formatCentsToCurrency(sale.total_in_cents);

  const parts: string[] = [];

  const push = (...segments: string[]) => parts.push(...segments);

  // Reset inicial
  push(CMD.INIT);

  // Título — centralizado, negrito, fonte double
  push(
    CMD.ALIGN_CENTER,
    CMD.FONT_DOUBLE,
    CMD.BOLD_ON,
    "OFICINA DE ARTE",
    CMD.BOLD_OFF,
    CMD.FONT_NORMAL,
    CMD.FEED,
  );

  // Data — centralizada, normal
  push(CMD.ALIGN_CENTER, `Data da venda: ${date}`, CMD.FEED);

  // Separador
  push(CMD.ALIGN_LEFT, SEPARATOR, CMD.FEED);

  // Cabeçalho da tabela — negrito
  push(
    CMD.BOLD_ON,
    `QTD  PRODUTO ${formatTableCell("VALOR (R$)", 19, "right")}`,
    CMD.BOLD_OFF,
    CMD.FEED,
  );

  // Itens
  for (const saleItem of sale.items) {
    push(
      formatTableLine([
        String(saleItem.quantity),
        saleItem.product_name,
        formatCentsToCurrency(saleItem.subtotal_in_cents).replace("R$", "").trim(),
      ]),
      CMD.FEED,
    );
  }

  // Separador
  push(SEPARATOR, CMD.FEED);

  // Total — negrito
  push(
    CMD.BOLD_ON,
    CMD.FONT_DOUBLE_HEIGHT,
    formatTableCell("TOTAL", LINE_WIDTH - formattedTotal.length - 1, "left") + " " + formattedTotal,
    CMD.BOLD_OFF,
    CMD.FONT_NORMAL,
  );

  push(CMD.CUT_FULL);

  return parts.join("");
}
