/**
 * Tipos compartilhados que espelham os DTOs do backend. Domínios ainda não
 * migrados para TypeScript continuam funcionando normalmente — TS e JS
 * coexistem no mesmo projeto (ver tsconfig.json, allowJs).
 */

export type ProductType = 'INSUMO' | 'PRODUTO_FINAL' | 'PRODUTO_INTERMEDIARIO';
export type UnitOfMeasure = 'G' | 'KG' | 'ML' | 'L' | 'UN' | 'DUZIA';
export type UserRole = 'ADMIN' | 'OPERADOR';
export type MovementType = 'ENTRY' | 'EXIT';
export type CashMovementType = 'INCOME' | 'EXPENSE';
export type ProductionOrderStatus = 'OPEN' | 'FINISHED' | 'CANCELLED';
export type AccountPayableStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type AccountReceivableStatus = 'PENDING' | 'RECEIVED' | 'OVERDUE';

/** Espelha ErrorResponse do backend (br.com.sigrest.api.exception). */
export interface ApiErrorResponse {
  codigo: string;
  message: string;
  status: number;
  timestamp: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  sellPrice: number;
  storage: number;
  minStorage: number;
  categoryId: number;
  categoryName?: string;
  tipo: ProductType | null;
  purchaseUnit: UnitOfMeasure | null;
  packageQuantity: number | null;
}

export interface ProductFormData {
  name: string;
  code: string;
  price: number | '';
  sellPrice: number | '';
  storage: number | '';
  minStorage: number | '';
  categoryId: number;
  tipo: ProductType | null;
  purchaseUnit: UnitOfMeasure | null;
  packageQuantity: number | null;
}

/** Endereço "achatado", como devolvido pelo backend em Person/Supplier. */
export interface FlatAddress {
  street?: string | null;
  number?: string | null;
  nbhd?: string | null;
  city?: string | null;
  uf?: string | null;
}

export interface Person extends FlatAddress {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

export interface Supplier extends FlatAddress {
  id: number;
  name: string;
  phone: string;
  email: string;
  registration: string;
  cnpj: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface SellItem {
  id: number;
  unitPrice: number;
  quantity: number;
  productId: number;
  productName: string;
}

export interface Sale {
  id: number;
  date: string;
  total: number;
  discount: number;
  paymentMethod: string;
  personName: string | null;
  items: SellItem[];
}

export interface PurchaseItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Purchase {
  id: number;
  date: string;
  total: number;
  supplier: Supplier | null;
  items: PurchaseItem[];
}

export interface StockMovement {
  id: number;
  product: Product;
  type: MovementType;
  quantity: number;
  date: string;
  description: string;
}

export interface TechnicalSheetItem {
  id: number;
  rawMaterial: Product;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface TechnicalSheet {
  id: number;
  name: string;
  finalProduct: Product;
  items: TechnicalSheetItem[];
  rendimento: number;
  labourCostPercent: number;
  variableExpensesPercent: number;
  desiredMarginPercent: number;
}

export interface ItemCost {
  itemId: number;
  rawMaterialName: string;
  quantity: number;
  unit: string;
  costPerBaseUnit: number;
  itemCost: number;
}

export interface CostCalculation {
  technicalSheetId: number;
  technicalSheetName: string;
  itemCosts: ItemCost[];
  ingredientsTotalCost: number;
  labourCostPercent: number;
  variableExpensesPercent: number;
  desiredMarginPercent: number;
  totalCostWithLabour: number;
  suggestedSellPrice: number;
  rendimento: number;
  perServingCost: number | null;
}

export interface ProductionOrder {
  id: number;
  finalProduct: Product;
  quantity: number;
  date: string;
  status: ProductionOrderStatus;
  notes: string | null;
}

export interface CashRegister {
  id: number;
  openingTime: string;
  closingTime: string | null;
  openingBalance: number;
  closingBalance: number | null;
  currentBalance: number;
  salesTotal: number;
  purchasesTotal: number;
  movementsTotal: number;
  openedBy: User | null;
  closedBy: User | null;
  /** Serializado como "open" pelo Jackson (getter Lombok isOpen() -> propriedade "open"). */
  open: boolean;
}

export interface CashMovement {
  id: number;
  cashRegisterId: number;
  date: string;
  type: CashMovementType;
  amount: number;
  description: string;
  user: User | null;
}

export interface AccountPayable {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate: string | null;
  status: AccountPayableStatus;
  supplier: Supplier | null;
}

export interface AccountReceivable {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  receiptDate: string | null;
  status: AccountReceivableStatus;
  person: Person | null;
}

export interface DashboardSummary {
  todayRevenue: number;
  todaySalesCount: number;
  monthRevenue: number;
  lowStockCount: number;
  totalReceivable: number;
  totalPayable: number;
  balanceForecast: number;
}
