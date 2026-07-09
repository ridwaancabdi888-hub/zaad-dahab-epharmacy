import { useCallback, useEffect, useState } from 'react';

/**
 * Standardizes the page/filter/loading/error state every admin list
 * screen needs (Medicines, Categories, Orders, Customers, Payments,
 * Audit Logs) against the backend's shared `{ items, meta }` pagination
 * envelope, so each page only has to supply a fetcher.
 */
export function usePaginatedList(fetchPage, { limit = 20, filters = {} } = {}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const filterKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPage({ page, limit, ...JSON.parse(filterKey) });
      setItems(result.items);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filterKey, reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Filters changing should always snap back to page 1.
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  return { items, meta, page, setPage, isLoading, error, refresh };
}
