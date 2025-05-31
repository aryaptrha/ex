// lib/types.ts
export interface Expense {
    id: string;
    user_id: string;
    expense_time: string;
    is_auto_time: boolean;
    category: string;
    payment_type: 'Cash' | 'Cashless';
    cashless_type?: string;
    total_amount: number;
    comment?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface ExpenseCategory {
    id: number;
    name: string;
    icon: string;
    is_active: boolean;
  }
  
  export interface CashlessType {
    id: number;
    name: string;
    is_active: boolean;
  }
  
  export interface ExpenseFormData {
    expense_time: string;
    is_auto_time: boolean;
    category: string;
    payment_type: 'Cash' | 'Cashless';
    cashless_type?: string;
    total_amount: number;
    comment?: string;
  }