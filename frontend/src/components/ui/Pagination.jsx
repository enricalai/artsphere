import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center gap-2 mt-8 flex-wrap">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-anthracite/20 text-anthracite/60 hover:border-prusse hover:text-prusse disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
            >
                ← Précédent
            </button>
            
            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    className={`px-3 py-1 border transition-colors rounded ${
                        page === currentPage
                            ? 'bg-prusse text-white border-prusse'
                            : 'border-anthracite/20 text-anthracite/60 hover:border-prusse hover:text-prusse'
                    } ${typeof page !== 'number' ? 'cursor-default' : ''}`}
                    disabled={typeof page !== 'number'}
                >
                    {page}
                </button>
            ))}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-anthracite/20 text-anthracite/60 hover:border-prusse hover:text-prusse disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
            >
                Suivant →
            </button>
        </div>
    );
}

export default Pagination;