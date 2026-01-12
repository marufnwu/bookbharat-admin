import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import CartDetailView from './CartDetailView';

const AbandonedCarts: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path=":id" element={<CartDetailView />} />
    </Routes>
  );
};

export default AbandonedCarts;
