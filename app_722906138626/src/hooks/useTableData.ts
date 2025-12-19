import { useState, useMemo } from 'react';

interface UseTableDataProps<T> {
  data: T[];
  initialPageSize?: number;
  searchFields?: (keyof T)[];
}

export function useTableData<T>({ data, initialPageSize = 20, searchFields = [] }: UseTableDataProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortField, setSortField] = useState<keyof T | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [searchText, setSearchText] = useState('');

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search
    if (searchText && searchFields.length > 0) {
      filtered = filtered.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          return String(value).toLowerCase().includes(searchText.toLowerCase());
        });
      });
    }

    // Sort
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: unknown = a[sortField];
        let bValue: unknown = b[sortField];

        // Special handling for common fields based on the original code
        if (sortField === 'update_time') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        } else if (sortField === 'id') {
          const aNum = parseInt(String(aValue), 10);
          const bNum = parseInt(String(bValue), 10);
          if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        }

        if (aValue === bValue) return 0;
        
        // Ensure comparison is safe for basic types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           const comparison = aValue > bValue ? 1 : -1;
           return sortOrder === 'asc' ? comparison : -comparison;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue > bValue ? 1 : -1;
            return sortOrder === 'asc' ? comparison : -comparison;
        }

        // Fallback for mixed or other types
        const comparison = String(aValue) > String(bValue) ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchText, searchFields, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentPageData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: keyof T) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    currentPageData,
    totalItems: filteredData.length,
    totalPages,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    searchText,
    handleSort,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  };
}
