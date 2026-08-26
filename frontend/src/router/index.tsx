import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Guard
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/AdminRoute';
import { useAuth } from '../contexts/AuthContext';

// Components / Forms / Lists
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';
import ReportPage from '../components/ReportPage';
import StockMovementList from '../components/StockMovementList';

import SaleList from '../components/SaleList';
import SaleForm from '../components/SaleForm';
import PurchaseList from '../components/PurchaseList';
import PurchaseForm from '../components/PurchaseForm';

import CashRegisterForm from '../components/CashRegisterForm';
import CashRegisterList from '../components/CashRegisterList';

import AccountPayableList from '../components/AccountPayableList';
import AccountPayableForm from '../components/AccountPayableForm';
import AccountReceivableList from '../components/AccountReceivableList';
import AccountReceivableForm from '../components/AccountReceivableForm';

import TechnicalSheetForm from '../components/TechnicalSheetForm';
import ProductionOrderForm from '../components/ProductionOrderForm';

// Page Wrappers
import People from '../pages/People';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Suppliers from '../pages/Suppliers';
import Users from '../pages/Users';
import TechnicalSheets from '../pages/TechnicalSheets';
import ProductionOrders from '../pages/ProductionOrders';

// Wrapper for TechnicalSheetForm at new path
const NewTechnicalSheetWrapper = () => {
  const navigate = useNavigate();
  return (
    <TechnicalSheetForm
      onSaveSuccess={() => navigate('/technical-sheets')}
      onCancel={() => navigate('/technical-sheets')}
    />
  );
};

// Wrapper for ProductionOrderForm at new path
const NewProductionOrderWrapper = () => {
  const navigate = useNavigate();
  return (
    <ProductionOrderForm
      onSaveSuccess={() => navigate('/production-orders')}
      onCancel={() => navigate('/production-orders')}
    />
  );
};

// Dynamic landing page redirect based on role
const LandingRedirect = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/sales/new" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginForm />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <LandingRedirect />,
      },
      {
        path: 'dashboard',
        element: (
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <AdminRoute>
            <ReportPage />
          </AdminRoute>
        ),
      },
      {
        path: 'people',
        element: <People />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'suppliers',
        element: <Suppliers />,
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <Users />
          </AdminRoute>
        ),
      },
      {
        path: 'sales',
        element: <SaleList />,
      },
      {
        path: 'sales/new',
        element: <SaleForm />,
      },
      {
        path: 'purchases',
        element: <PurchaseList />,
      },
      {
        path: 'purchases/new',
        element: <PurchaseForm />,
      },
      {
        path: 'stock-movements',
        element: <StockMovementList />,
      },
      {
        path: 'technical-sheets',
        element: <TechnicalSheets />,
      },
      {
        path: 'technical-sheets/new',
        element: <NewTechnicalSheetWrapper />,
      },
      {
        path: 'production-orders',
        element: <ProductionOrders />,
      },
      {
        path: 'production-orders/new',
        element: <NewProductionOrderWrapper />,
      },
      {
        path: 'cash-registers',
        element: (
          <AdminRoute>
            <CashRegisterForm />
          </AdminRoute>
        ),
      },
      {
        path: 'cash-registers/history',
        element: (
          <AdminRoute>
            <CashRegisterList />
          </AdminRoute>
        ),
      },
      {
        path: 'accounts-payable',
        element: (
          <AdminRoute>
            <AccountPayableList />
          </AdminRoute>
        ),
      },
      {
        path: 'accounts-payable/new',
        element: (
          <AdminRoute>
            <AccountPayableForm />
          </AdminRoute>
        ),
      },
      {
        path: 'accounts-receivable',
        element: (
          <AdminRoute>
            <AccountReceivableList />
          </AdminRoute>
        ),
      },
      {
        path: 'accounts-receivable/new',
        element: (
          <AdminRoute>
            <AccountReceivableForm />
          </AdminRoute>
        ),
      },
      {
        path: '*',
        element: <LandingRedirect />,
      },
    ],
  },
]);
