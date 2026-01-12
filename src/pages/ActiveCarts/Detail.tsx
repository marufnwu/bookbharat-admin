import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminCartManager from '../../components/AdminCartManager/AdminCartManager';
import { adminApi } from '../AbandonedCarts/api';

const ActiveCartDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cartId = parseInt(id || '0');

  if (!cartId) return <div>Invalid Cart ID</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/active-carts')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cart #{cartId}</h1>
          <p className="text-gray-500">Manage cart items and details</p>
        </div>
      </div>

      <AdminCartManager 
        cartId={cartId} 
        fetchCartDetails={adminApi.getActiveCartDetails}
        onUpdate={() => {
            // Optional: Refetch or show toast
        }} 
      />
    </div>
  );
};

export default ActiveCartDetail;
