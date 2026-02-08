export const CURRENCY = "сом";

export function formatMoney(value: number): string {
  return `${value.toLocaleString("ru-RU")} ${CURRENCY}`;
}
