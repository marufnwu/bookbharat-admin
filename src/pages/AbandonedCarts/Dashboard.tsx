/**
 * Abandoned Carts Dashboard
 * Main page for the abandoned cart system
 */

import React, { useState } from 'react';
import { RefreshCw, Download, Settings } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Constants & Types
import type { Cart, CartFilters } from './types';

// Components
import StatsCards from './components/StatsCards';
import CartFiltersComponent from './components/CartFilters';
import CartTable from './components/CartTable';
import RecoveryModal from './components/RecoveryModal';
import DiscountModal from './components/DiscountModal';
import NoteModal from './components/NoteModal';

// Hooks
import {
  useAbandonedCarts,
  useRecoveryStats,
  useFilterOptions,
  useSendRecovery,
  useGenerateDiscount,
  useMarkRecovered,
  useAddNote, // Although not used directly on dashboard, needed for modal
} from './hooks';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState<Partial<CartFilters>>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [selectedCarts, setSelectedCarts] = useState<number[]>([]);
  
  // Modal State
  const [modalState, setModalState] = useState<{
    type: 'recovery' | 'discount' | 'note' | null;
    cart: Cart | null;
  }>({ type: null, cart: null });

  // Queries
  const { data: cartsData, isLoading: cartsLoading, refetch: refetchCarts } = useAbandonedCarts(filters, page);
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useRecoveryStats();
  const { data: filterOptions } = useFilterOptions();

  // Mutations
  const sendRecoveryMutation = useSendRecovery();
  const generateDiscountMutation = useGenerateDiscount();
  const markRecoveredMutation = useMarkRecovered();

  // Handlers
  const handleRefresh = () => {
    refetchCarts();
    refetchStats();
    toast.success('Data refreshed');
  };

  const handleFilterChange = (key: keyof CartFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const handleResetFilters = () => {
    setFilters({
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setPage(1);
  };

  const handleSelectCart = (cartId: number, selected: boolean) => {
    if (selected) {
      setSelectedCarts((prev) => [...prev, cartId]);
    } else {
      setSelectedCarts((prev) => prev.filter((id) => id !== cartId));
    }
  };

  const handleSelectAll = () => {
    if (!cartsData?.data) return;
    if (selectedCarts.length === cartsData.data.length) {
      setSelectedCarts([]);
    } else {
      setSelectedCarts(cartsData.data.map((c) => c.id));
    }
  };

  // Modal Handlers
  const openModal = (type: 'recovery' | 'discount' | 'note', cart: Cart) => {
    setModalState({ type, cart });
  };

  const closeModal = () => {
    setModalState({ type: null, cart: null });
  };

  // Pagination
  const totalPages = Math.ceil((cartsData?.meta?.total || 0) / (cartsData?.meta?.per_page || 20));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Abandoned Carts</h1>
          <p className="text-gray-500">Track and recover lost sales</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
            title="Refresh Data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
            title="Export"
          >
            <Download className="h-5 w-5" />
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={statsData?.data} isLoading={statsLoading} />

      {/* Filters */}
      <CartFiltersComponent
        filters={filters}
        filterOptions={filterOptions?.data}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <CartTable
        carts={cartsData?.data || []}
        selectedCarts={selectedCarts}
        onSelectCart={handleSelectCart}
        onSelectAll={handleSelectAll}
        selectAll={selectedCarts.length === (cartsData?.data?.length || 0) && (cartsData?.data?.length || 0) > 0}
        onSendRecovery={(cart) => openModal('recovery', cart)}
        onGenerateDiscount={(cart) => openModal('discount', cart)}
        onMarkRecovered={(cart) => {
            if (window.confirm('Are you sure you want to mark this cart as recovered?')) {
                markRecoveredMutation.mutate({ cartId: cart.id });
            }
        }}
        isLoading={cartsLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {modalState.cart && (
        <>
          <RecoveryModal
            cart={modalState.cart}
            isOpen={modalState.type === 'recovery'}
            onClose={closeModal}
            isPending={sendRecoveryMutation.isPending}
            onSend={(data) => {
              if (modalState.cart) {
                sendRecoveryMutation.mutate(
                  { cartId: modalState.cart.id, data },
                  { onSuccess: closeModal }
                );
              }
            }}
          />
          
          <DiscountModal
            cart={modalState.cart}
            isOpen={modalState.type === 'discount'}
            onClose={closeModal}
            isPending={generateDiscountMutation.isPending}
            onGenerate={(data) => {
              if (modalState.cart) {
                generateDiscountMutation.mutate(
                  { cartId: modalState.cart.id, data },
                  { onSuccess: closeModal }
                );
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
