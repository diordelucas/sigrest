import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  LogOut,
  Tags,
  Archive,
  ArrowDownToLine,
  PackagePlus,
  ChefHat,
  ClipboardList,
  Wallet,
  History,
  DollarSign,
  HandCoins,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  adminOnly?: boolean;
  /** Sub-rótulo exibido como divisor acima deste item dentro do grupo (ex.: "Caixa" / "Contas"). */
  groupLabel?: string;
}

interface MenuGroup {
  kind: 'group';
  key: string;
  icon: ReactNode;
  label: string;
  adminOnly?: boolean;
  items: MenuItem[];
}

interface MenuEntry {
  kind: 'item';
  item: MenuItem;
}

interface MenuSection {
  title: string;
  entries: (MenuEntry | MenuGroup)[];
}

const item = (data: MenuItem): MenuEntry => ({ kind: 'item', item: data });

const COLLAPSED_KEY = '@sigrest:sidebar-collapsed';

const menuSections: MenuSection[] = [
  {
    title: 'Visão Geral',
    entries: [
      item({ icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', adminOnly: true }),
      item({ icon: <BarChart3 size={20} />, label: 'Relatórios', path: '/reports', adminOnly: true }),
    ],
  },
  {
    title: 'Cadastros',
    entries: [
      item({ icon: <Users size={20} />, label: 'Pessoas', path: '/people' }),
      item({ icon: <Package size={20} />, label: 'Produtos', path: '/products' }),
      item({ icon: <Tags size={20} />, label: 'Categorias', path: '/categories' }),
      item({ icon: <Truck size={20} />, label: 'Fornecedores', path: '/suppliers' }),
    ],
  },
  {
    title: 'Operação',
    entries: [
      {
        kind: 'group',
        key: 'vendas',
        icon: <ShoppingCart size={20} />,
        label: 'Vendas',
        items: [
          { icon: <ShoppingCart size={18} />, label: 'Nova Venda', path: '/sales/new' },
          { icon: <History size={18} />, label: 'Histórico de Vendas', path: '/sales' },
        ],
      },
      {
        kind: 'group',
        key: 'compras-estoque',
        icon: <ArrowDownToLine size={20} />,
        label: 'Compras & Estoque',
        items: [
          { icon: <PackagePlus size={18} />, label: 'Nova Compra', path: '/purchases/new' },
          { icon: <ArrowDownToLine size={18} />, label: 'Compras', path: '/purchases' },
          { icon: <Archive size={18} />, label: 'Movimentação de Estoque', path: '/stock-movements' },
        ],
      },
      {
        kind: 'group',
        key: 'producao',
        icon: <ChefHat size={20} />,
        label: 'Produção',
        items: [
          { icon: <ClipboardList size={18} />, label: 'Fichas Técnicas', path: '/technical-sheets' },
          { icon: <ChefHat size={18} />, label: 'Ordens de Produção', path: '/production-orders' },
        ],
      },
    ],
  },
  {
    title: 'Financeiro',
    entries: [
      {
        kind: 'group',
        key: 'financeiro',
        icon: <Wallet size={20} />,
        label: 'Financeiro',
        adminOnly: true,
        items: [
          { icon: <Wallet size={18} />, label: 'Controle de Caixa', path: '/cash-registers', groupLabel: 'Caixa' },
          { icon: <History size={18} />, label: 'Histórico de Caixa', path: '/cash-registers/history' },
          { icon: <DollarSign size={18} />, label: 'Contas a Pagar', path: '/accounts-payable', groupLabel: 'Contas' },
          { icon: <HandCoins size={18} />, label: 'Contas a Receber', path: '/accounts-receivable' },
        ],
      },
    ],
  },
  {
    title: 'Administração',
    entries: [
      item({ icon: <ShieldCheck size={20} />, label: 'Usuários', path: '/users', adminOnly: true }),
    ],
  },
];

const Sidebar = () => {
  const { signOut, currentUser } = useAuth();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  });
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Abre automaticamente o grupo que contém a rota ativa (sem fechar os que o usuário já abriu).
  useEffect(() => {
    for (const section of menuSections) {
      for (const entry of section.entries) {
        if (entry.kind === 'group' && entry.items.some((i) => i.path === location.pathname)) {
          setOpenGroups((prev) => new Set(prev).add(entry.key));
        }
      }
    }
  }, [location.pathname]);

  const visibleSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          entries: section.entries.filter((entry) =>
            entry.kind === 'item' ? !entry.item.adminOnly || isAdmin : !entry.adminOnly || isAdmin
          ),
        }))
        .filter((section) => section.entries.length > 0),
    [isAdmin]
  );

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const linkClasses = (isActive: boolean, compact = false) => `
    flex items-center rounded-xl transition-all duration-200 group
    ${compact ? 'justify-between px-3 py-2' : 'justify-center p-2.5'}
    ${isActive
      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5'
      : 'text-ink-muted hover:bg-surface-2 hover:text-ink border border-transparent'
    }
  `;

  const renderItem = (menuItem: MenuItem, nested = false) => (
    <NavLink
      key={menuItem.path}
      to={menuItem.path}
      title={collapsed ? menuItem.label : undefined}
      className={({ isActive }) => `
        flex items-center gap-3 rounded-xl transition-all duration-200 group px-3 py-2
        ${nested ? 'ml-2' : ''}
        ${isActive
          ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5'
          : 'text-ink-muted hover:bg-surface-2 hover:text-ink border border-transparent'
        }
      `}
    >
      <span className="transition-transform duration-200 group-hover:scale-110 shrink-0">{menuItem.icon}</span>
      <span className="text-sm font-medium truncate">{menuItem.label}</span>
    </NavLink>
  );

  return (
    <aside
      className={`flex flex-col h-full bg-surface border-r border-line select-none shrink-0 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-line shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
          <ShoppingCart size={18} className="text-white" />
        </div>
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-tight text-ink truncate">
            SigRest<span className="text-primary-500">Gestão</span>
          </h1>
        )}
      </div>

      <nav className={`flex-1 p-3 space-y-4 ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
        {visibleSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}

            {section.entries.map((entry) => {
              if (entry.kind === 'item') {
                return collapsed ? (
                  <NavLink
                    key={entry.item.path}
                    to={entry.item.path}
                    title={entry.item.label}
                    className={({ isActive }) => linkClasses(isActive)}
                  >
                    <span className="transition-transform duration-200 group-hover:scale-110">{entry.item.icon}</span>
                  </NavLink>
                ) : (
                  renderItem(entry.item)
                );
              }

              const group = entry;
              const isGroupActive = group.items.some((i) => i.path === location.pathname);
              const isOpen = openGroups.has(group.key);

              if (collapsed) {
                return (
                  <div
                    key={group.key}
                    className="relative"
                    onMouseEnter={() => setHoveredGroup(group.key)}
                    onMouseLeave={() => setHoveredGroup((g) => (g === group.key ? null : g))}
                  >
                    <button
                      type="button"
                      title={group.label}
                      className={`w-full ${linkClasses(isGroupActive)}`}
                    >
                      <span className="transition-transform duration-200 group-hover:scale-110">{group.icon}</span>
                    </button>
                    {hoveredGroup === group.key && (
                      <div className="absolute left-full top-0 ml-2 w-56 card p-2 z-50 space-y-1">
                        <p className="px-2 py-1 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                          {group.label}
                        </p>
                        {group.items.map((i) => (
                          <React.Fragment key={i.path}>
                            {i.groupLabel && (
                              <p className="px-2 pt-1 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                                {i.groupLabel}
                              </p>
                            )}
                            {renderItem(i)}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={isOpen}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group ${
                      isGroupActive && !isOpen
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="transition-transform duration-200 group-hover:scale-110">{group.icon}</span>
                      <span className="text-sm font-medium">{group.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-1 border-l border-line ml-5 pl-2">
                      {group.items.map((i) => (
                        <React.Fragment key={i.path}>
                          {i.groupLabel && (
                            <p className="px-3 pt-2 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                              {i.groupLabel}
                            </p>
                          )}
                          {renderItem(i, true)}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line shrink-0 space-y-1">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir menu' : 'Retrair menu'}
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors font-medium ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!collapsed && <span>Retrair menu</span>}
        </button>
        <button
          onClick={signOut}
          title={collapsed ? 'Sair do Sistema' : undefined}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl text-ink-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors font-medium group ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} className="group-hover:text-rose-500 transition-colors" />
          {!collapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
