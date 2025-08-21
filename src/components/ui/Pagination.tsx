// src/components/Pagination.tsx
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  totalItems: number;
}

const pageSizes = [5, 10, 25, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
}: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    
    const maxPagesToShow = isMobile ? 3 : 5;
    const pages = [];
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-left');
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-right');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
      <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap justify-center">
        <span className="text-xs sm:text-sm">Tampilkan</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="rounded-md border border-gray-300 py-1.5 text-xs sm:text-sm"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-xs sm:text-sm">entri per halaman</span>
        <span className="hidden sm:inline text-xs sm:text-sm text-gray-500 ml-2">
          | {startItem}-{endItem} dari {totalItems}
        </span>
      </div>
      
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="text-xs text-gray-500 sm:hidden">
          {startItem}-{endItem} dari {totalItems}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
            className="text-xs px-2 py-1.5 sm:px-3 sm:py-2"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline ml-1">Sebelumnya</span>
          </Button>
          
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis-left' || page === 'ellipsis-right') {
              return (
                <span key={index} className="px-2 py-1 text-gray-500">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              );
            }
            
            return (
              <Button
                key={page}
                onClick={() => onPageChange(page as number)}
                variant={page === currentPage ? 'primary' : 'secondary'}
                size="sm"
                className={`min-w-[2rem] px-2 py-1.5 text-xs sm:min-w-[2.5rem] sm:text-sm ${
                  page === currentPage ? 'font-semibold' : ''
                }`}
                style={page === currentPage ? { backgroundColor: '#664ae7', color: 'white' } : {}}
              >
                {page}
              </Button>
            );
          })}
          
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="sm"
            className="text-xs px-2 py-1.5 sm:px-3 sm:py-2"
          >
            <span className="hidden xs:inline mr-1">Selanjutnya</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}