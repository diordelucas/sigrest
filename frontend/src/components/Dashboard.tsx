import React, { useState, useEffect, ReactNode } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import moment from 'moment';
import { formatBRL } from '../utils/currency';
import { DashboardSummary } from '../types';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number | string; color: string }[];
  formatter?: (value: number | string) => string;
}

const ChartTooltip = ({ active, label, payload, formatter }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 shadow-xl text-xs min-w-[140px]">
      {label && <p className="font-semibold text-ink mb-1.5">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <p key={i} className="flex items-center justify-between gap-3 text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-semibold text-ink">{formatter ? formatter(p.value) : p.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, accent }: KpiCardProps) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-ink truncate">{value}</p>
    </div>
  </div>
);

const EMPTY_SUMMARY: DashboardSummary = {
  todayRevenue: 0,
  todaySalesCount: 0,
  monthRevenue: 0,
  lowStockCount: 0,
  totalReceivable: 0,
  totalPayable: 0,
  balanceForecast: 0,
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [salesByPeriod, setSalesByPeriod] = useState<any[]>([]);
  const [stockMovement, setStockMovement] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const today = moment();
      const oneMonthAgo = today.clone().subtract(1, 'month');
      const sixMonthsAgo = today.clone().subtract(6, 'months');

      // KPIs: fetched independently so the cards always render, even if charts fail.
      try {
        const { data } = await api.get<DashboardSummary>('/dashboard/summary');
        setSummary(data);
      } catch (err) {
        // keep zeroed defaults — never blank the screen, but tell the user why they're zero
        toast.error(getErrorMessage(err, 'Não foi possível carregar os indicadores do dashboard.'));
      }

      // Charts: allSettled so one failing report doesn't wipe out the others.
      const results = await Promise.allSettled([
        api.get('/reports/monthly-revenue', {
          params: { startMonth: sixMonthsAgo.format('YYYY-MM-DD'), endMonth: today.format('YYYY-MM-DD') },
        }),
        api.get('/reports/top-selling-products', { params: { limit: 5 } }),
        api.get('/reports/sales-by-period', {
          params: { startDate: oneMonthAgo.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') },
        }),
        api.get('/reports/stock-movement', {
          params: { startDate: oneMonthAgo.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') },
        }),
      ]);

      const dataOf = (i: number): any[] =>
        results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value.data : [];

      setMonthlyRevenue(dataOf(0).map((item) => ({ ...item, month: moment(item.month).format('MMM YYYY') })));
      setTopSellingProducts(dataOf(1));
      setSalesByPeriod(dataOf(2).map((item) => ({ ...item, date: moment(item.date).format('DD/MM') })));
      setStockMovement(dataOf(3));

      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink mb-6">Dashboard Gerencial</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-4">
        <KpiCard
          icon={<DollarSign size={22} className="text-white" />}
          accent="bg-primary-500"
          label="Faturamento do Dia"
          value={`R$ ${formatBRL(summary.todayRevenue ?? 0)}`}
        />
        <KpiCard
          icon={<ShoppingCart size={22} className="text-white" />}
          accent="bg-sky-500"
          label="Vendas do Dia"
          value={summary.todaySalesCount ?? 0}
        />
        <KpiCard
          icon={<TrendingUp size={22} className="text-white" />}
          accent="bg-emerald-500"
          label="Faturamento do Mês"
          value={`R$ ${formatBRL(summary.monthRevenue ?? 0)}`}
        />
        <KpiCard
          icon={<AlertTriangle size={22} className="text-white" />}
          accent="bg-amber-500"
          label="Estoque Baixo"
          value={summary.lowStockCount ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <KpiCard
          icon={<ArrowUpCircle size={22} className="text-white" />}
          accent="bg-emerald-500"
          label="A Receber (em aberto)"
          value={`R$ ${formatBRL(summary.totalReceivable ?? 0)}`}
        />
        <KpiCard
          icon={<ArrowDownCircle size={22} className="text-white" />}
          accent="bg-rose-500"
          label="A Pagar (em aberto)"
          value={`R$ ${formatBRL(summary.totalPayable ?? 0)}`}
        />
        <KpiCard
          icon={<Scale size={22} className="text-white" />}
          accent={(summary.balanceForecast ?? 0) >= 0 ? 'bg-teal-500' : 'bg-orange-500'}
          label="Saldo Previsto"
          value={`R$ ${formatBRL(summary.balanceForecast ?? 0)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">Faturamento Mensal</h3>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={{ stroke: 'rgb(var(--color-line))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--color-primary-500))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<ChartTooltip formatter={(v) => `R$ ${formatBRL(Number(v))}`} />}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgb(var(--color-ink-muted))' }} />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="rgb(var(--color-primary-500))"
                  name="Faturamento (R$)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'rgb(var(--color-primary-500))', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'rgb(var(--color-primary-500))', stroke: 'rgb(var(--color-surface))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-muted text-center py-20">Sem dados de faturamento no período.</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">
            Produtos Mais Vendidos (Quantidade)
          </h3>
          {topSellingProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellingProducts} barCategoryGap="30%">
                <defs>
                  <linearGradient id="topProductsBarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--color-primary-500))" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" vertical={false} />
                <XAxis
                  dataKey="productName"
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={{ stroke: 'rgb(var(--color-line))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--color-primary-500) / 0.08)', radius: 8 }}
                  content={<ChartTooltip />}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgb(var(--color-ink-muted))' }} />
                <Bar
                  dataKey="totalQuantitySold"
                  fill="url(#topProductsBarFill)"
                  name="Quantidade Vendida"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-muted text-center py-20">Nenhuma venda registrada ainda.</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">
            Vendas por Período (Último Mês)
          </h3>
          {salesByPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={{ stroke: 'rgb(var(--color-line))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--color-primary-500))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<ChartTooltip />}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgb(var(--color-ink-muted))' }} />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="rgb(var(--color-primary-500))"
                  name="Receita (R$)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'rgb(var(--color-primary-500))', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'rgb(var(--color-primary-500))', stroke: 'rgb(var(--color-surface))', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="rgb(var(--color-ink-muted))"
                  name="Nº Vendas"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'rgb(var(--color-ink-muted))', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'rgb(var(--color-ink-muted))', stroke: 'rgb(var(--color-surface))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-muted text-center py-20">Sem vendas no último mês.</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">
            Resumo de Movimentação de Estoque (Último Mês)
          </h3>
          <div className="overflow-y-auto max-h-[300px]">
            {stockMovement.length > 0 ? (
              stockMovement.map((movement, index) => (
                <div key={index} className="mb-2 p-2 border-b border-line">
                  <p className="text-xs text-ink">
                    <strong>{moment(movement.date).format('DD/MM HH:mm')}</strong>
                    {' - '}
                    {movement.productName}:{' '}
                    <span className={movement.type === 'ENTRY' ? 'text-emerald-600' : 'text-rose-600'}>
                      {movement.type === 'ENTRY' ? '+' : '-'}
                      {movement.quantity}
                    </span>{' '}
                    ({movement.description})
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted text-center py-4">Nenhuma movimentação de estoque recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
