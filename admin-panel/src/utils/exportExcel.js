/**
 * Builds a multi-sheet .xlsx workbook from `{ sheetName, rows }` sections
 * — used by the Reports screen's "Export Excel" button. Each `rows` entry
 * is a plain object; keys become the header row. `xlsx` is dynamically
 * imported so it doesn't sit in the main bundle for a feature only used
 * on demand.
 */
export async function exportReportExcel({ fileName, sections }) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (const section of sections) {
    const worksheet = XLSX.utils.json_to_sheet(section.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, section.sheetName.slice(0, 31));
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
