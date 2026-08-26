import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Search, Bell, User, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useAuth } from '../contexts/AuthContext';
import api, { getErrorMessage } from '../services/api';

interface LowStockProduct {
  id: number;
  name: string;
  storage: number;
  minStorage: number;
}

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockProduct[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await api.get<LowStockProduct[]>('/product/low-stock');
        setLowStockAlerts(response.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Não foi possível carregar os alertas de estoque.'));
      }
    };
    fetchLowStock();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-auto transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-ink-muted hover:text-ink rounded-xl hover:bg-surface-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold hidden sm:block">Painel de Gestão</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-surface-2 px-4 py-2 rounded-full border border-line">
              <Search size={18} className="text-ink-muted" />
              <input
                type="text"
                placeholder="Buscar em todo o sistema..."
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 placeholder:text-ink-muted text-ink"
              />
            </div>

            <ThemeSwitcher />

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 text-ink-muted hover:text-ink transition-colors rounded-full hover:bg-surface-2 focus:outline-none"
              >
                <Bell size={20} />
                {lowStockAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {lowStockAlerts.length}
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 card overflow-hidden z-50">
                  <div className="p-3 bg-surface-2 border-b border-line flex items-center justify-between">
                    <span className="font-semibold text-sm text-ink">Alertas de Estoque</span>
                    <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-medium">
                      {lowStockAlerts.length} {lowStockAlerts.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {lowStockAlerts.length === 0 ? (
                      <div className="p-4 text-center flex flex-col items-center gap-2">
                        <span className="text-emerald-500 text-2xl font-bold">✓</span>
                        <p className="text-sm text-ink-muted font-semibold">Tudo certo com o estoque</p>
                      </div>
                    ) : (
                      lowStockAlerts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 border-b border-line hover:bg-surface-2 transition-colors flex justify-between items-center text-sm"
                        >
                          <span className="font-semibold text-ink">{product.name}</span>
                          <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg">
                            Qtd: {product.storage} (mín: {product.minStorage})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-line">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-medium text-ink">{currentUser?.name || 'Usuário'}</span>
                <span className="text-xs text-ink-muted">{currentUser?.role || 'Operador'}</span>
              </div>
              <button className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/30 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors">
                <User size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
