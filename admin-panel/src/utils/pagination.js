export function normalizeTotalPages(totalPages) {
  const parsed = Number(totalPages);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export function clampPage(page, totalPages) {
  const lastPage = normalizeTotalPages(totalPages);
  const parsed = Number(page);
  const currentPage = Number.isFinite(parsed) ? Math.floor(parsed) : 1;

  return Math.min(Math.max(currentPage, 1), lastPage);
}
