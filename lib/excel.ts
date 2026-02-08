import * as XLSX from "xlsx";

export interface ExcelColumn {
  key: string;
  label: string;
}

export function downloadExcel(
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  filenamePrefix: string
) {
  const data = rows.map((row) => {
    const out: Record<string, string | number> = {};
    columns.forEach(({ key, label }) => {
      const v = row[key];
      out[label] =
        v == null
          ? ""
          : typeof v === "object" && v !== null && "toISOString" in (v as object)
            ? (v as Date).toISOString().slice(0, 10)
            : (v as string | number);
    });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${date}.xlsx`);
}

const CHUNK_SIZE = 2000;

export async function exportTableChunked(
  fetchPage: (offset: number, limit: number) => Promise<Record<string, unknown>[]>,
  totalCount: number,
  sheetName: string,
  columns: ExcelColumn[],
  filenamePrefix: string,
  onProgress?: (loaded: number, total: number) => void
) {
  const allRows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < totalCount; offset += CHUNK_SIZE) {
    const chunk = await fetchPage(offset, CHUNK_SIZE);
    allRows.push(...chunk);
    onProgress?.(Math.min(offset + chunk.length, totalCount), totalCount);
    if (chunk.length < CHUNK_SIZE) break;
  }
  downloadExcel(sheetName, columns, allRows, filenamePrefix);
}
