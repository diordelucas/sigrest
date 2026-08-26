import React, { useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import moment from 'moment';
import { formatBRL } from '../utils/currency';
import Button from './ui/Button';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

type ReportType =
  | ''
  | 'sales-by-period'
  | 'top-selling-products'
  | 'monthly-revenue'
  | 'stock-movement'
  | 'financial-flow'
  | 'purchase-history';

const ReportPage = () => {
  const [reportType, setReportType] = useState<ReportType>('');
  const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      let response;
      switch (reportType) {
        case 'sales-by-period':
          response = await api.get('/reports/sales-by-period', { params: { startDate, endDate } });
          setReportData(response.data.map((item: any) => ({ ...item, date: moment(item.date).format('DD/MM/YYYY') })));
          break;
        case 'top-selling-products':
          response = await api.get('/reports/top-selling-products', { params: { limit: 10 } });
          setReportData(response.data);
          break;
        case 'monthly-revenue':
          response = await api.get('/reports/monthly-revenue', {
            params: {
              startMonth: moment(startDate).startOf('month').format('YYYY-MM-DD'),
              endMonth: moment(endDate).endOf('month').format('YYYY-MM-DD'),
            },
          });
          setReportData(response.data.map((item: any) => ({ ...item, month: moment(item.month).format('MMM YYYY') })));
          break;
        case 'stock-movement':
          response = await api.get('/reports/stock-movement', { params: { startDate, endDate } });
          setReportData(
            response.data.map((item: any) => ({ ...item, date: moment(item.date).format('DD/MM/YYYY HH:mm') }))
          );
          break;
        case 'financial-flow':
          response = await api.get('/reports/financial-flow', { params: { startDate, endDate } });
          setReportData(response.data.map((item: any) => ({ ...item, month: item.month })));
          break;
        case 'purchase-history':
          response = await api.get('/purchases');
          setReportData(
            response.data.map((item: any) => ({
              ...item,
              date: moment(item.date).format('DD/MM/YYYY'),
              supplierName: item.supplier?.name || '—',
              itemCount: item.items?.length ?? 0,
            }))
          );
          break;
        default:
          setError('Selecione um tipo de relatório.');
          break;
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao gerar relatório.'));
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'sales-by-period':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" name="Receita Total (R$)" strokeWidth={2} />
              <Line type="monotone" dataKey="totalSales" stroke="#82ca9d" name="Total de Vendas" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'top-selling-products':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" />
              <XAxis dataKey="productName" tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalQuantitySold" fill="#8884d8" name="Quantidade Vendida" />
              <Bar dataKey="totalRevenue" fill="#82ca9d" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'monthly-revenue':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#f97316" name="Faturamento (R$)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'stock-movement':
        return (
          <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>Data/Hora</Th>
                  <Th>Produto</Th>
                  <Th>Tipo</Th>
                  <Th className="text-right">Quantidade</Th>
                  <Th>Descrição</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reportData.map((movement, index) => (
                  <tr key={index} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{movement.date}</td>
                    <td className="px-4 py-3 text-sm text-ink">{movement.productName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          movement.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {movement.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink text-right">{movement.quantity}</td>
                    <td className="px-4 py-3 text-sm text-ink">{movement.description}</td>
                  </tr>
                ))}
              </tbody>
          </Table>
        );
      case 'financial-flow':
        return (
          <div>
            <p className="text-xs text-ink-muted mb-4">Entradas = faturamento de vendas · Saídas = total de compras</p>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-muted))' }} />
                <Tooltip formatter={(v: number) => `R$ ${formatBRL(v)}`} />
                <Legend />
                <Bar dataKey="totalEntradas" fill="#10b981" name="Entradas (R$)" />
                <Bar dataKey="totalSaidas" fill="#f43f5e" name="Saídas (R$)" />
                <Line type="monotone" dataKey="saldo" stroke="#6366f1" name="Saldo (R$)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <Table>
                <thead className="bg-surface-2 border-b border-line">
                  <tr>
                    <Th>Mês</Th>
                    <Th className="text-right">Entradas</Th>
                    <Th className="text-right">Saídas</Th>
                    <Th className="text-right">Saldo</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reportData.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-2">
                      <td className="px-4 py-3 text-sm text-ink">{row.month}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right font-medium">
                        R$ {formatBRL(row.totalEntradas)}
                      </td>
                      <td className="px-4 py-3 text-sm text-rose-600 text-right font-medium">
                        R$ {formatBRL(row.totalSaidas)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-bold ${
                          row.saldo >= 0 ? 'text-ink' : 'text-orange-600'
                        }`}
                      >
                        R$ {formatBRL(row.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );
      case 'purchase-history':
        return (
          <div>
            <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>Data</Th>
                  <Th>Fornecedor</Th>
                  <Th className="text-right">Itens</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reportData.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 text-sm text-ink">{purchase.date}</td>
                    <td className="px-4 py-3 text-sm text-ink">{purchase.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-ink text-right">{purchase.itemCount}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink text-right">
                      R$ {formatBRL(purchase.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {reportData.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-8">Nenhuma compra registrada.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-ink mb-6">Relatórios Gerenciais</h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Tipo de Relatório
            </label>
            <Field
              as="select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="">Nenhum</option>
              <option value="sales-by-period">Vendas por Período</option>
              <option value="top-selling-products">Produtos Mais Vendidos</option>
              <option value="monthly-revenue">Faturamento Mensal</option>
              <option value="stock-movement">Movimentação de Estoque</option>
              <option value="financial-flow">Fluxo Financeiro</option>
              <option value="purchase-history">Histórico de Compras</option>
            </Field>
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Data Inicial
            </label>
            <Field
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Data Final
            </label>
            <Field type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Button
              className="w-full"
              onClick={handleGenerateReport}
              disabled={loading || !reportType}
              loading={loading}
              loadingText="Gerando..."
            >
              Gerar
            </Button>
          </div>
        </div>

        {reportData && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">Resultado do Relatório</h3>
            {renderReportContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
