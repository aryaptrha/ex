'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Expense, ExpenseCategory } from '@/lib/types';

interface ExpenseListProps {
  refreshTrigger?: number;
}

export default function ExpenseList({ refreshTrigger }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [refreshTrigger]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*');
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_time', { ascending: false });

      if (error) {
        throw error;
      }

      setExpenses(data || []);
      
      // Calculate total
      const total = (data || []).reduce((sum, expense) => sum + expense.total_amount, 0);
      setTotalExpenses(total);

    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Expense deleted successfully');
      fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDayHeader = (dayKey: string) => {
    const date = new Date(dayKey);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatDateInDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate current month and today's totals
  const getCurrentMonthTotal = () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.expense_time);
        const expenseMonthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        return expenseMonthKey === currentMonthKey;
      })
      .reduce((sum, expense) => sum + expense.total_amount, 0);
  };

  const getTodayTotal = () => {
    const today = new Date().toDateString();
    return expenses
      .filter(expense => new Date(expense.expense_time).toDateString() === today)
      .reduce((sum, expense) => sum + expense.total_amount, 0);
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || '💰';
  };

  const groupExpensesByMonthAndDay = (expenses: Expense[]) => {
    const groups: { [monthKey: string]: { [dayKey: string]: Expense[] } } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.expense_time);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayKey = date.toDateString();
      
      if (!groups[monthKey]) {
        groups[monthKey] = {};
      }
      if (!groups[monthKey][dayKey]) {
        groups[monthKey][dayKey] = [];
      }
      groups[monthKey][dayKey].push(expense);
    });

    // Sort months descending, then days within each month descending
    const sortedMonths = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    
    return sortedMonths.map(([monthKey, days]) => {
      const sortedDays = Object.entries(days).sort(([a], [b]) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      return [monthKey, sortedDays] as [string, [string, Expense[]][]];
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  const groupedExpenses = groupExpensesByMonthAndDay(expenses);
  const currentMonthTotal = getCurrentMonthTotal();
  const todayTotal = getTodayTotal();

  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">This Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(currentMonthTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(todayTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-center">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground">
              From {expenses.length} total expenses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {groupedExpenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No expenses recorded yet. Add your first expense!
            </div>
          </CardContent>
        </Card>
      ) : (
        groupedExpenses.map(([monthKey, daysData]) => {
          const monthExpenses = daysData.flatMap(([, expenses]) => expenses);
          const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.total_amount, 0);
          
          return (
            <Card key={monthKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {formatMonthHeader(monthKey)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {monthExpenses.length} expenses • {formatCurrency(monthTotal)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {daysData.map(([dayKey, dayExpenses]) => {
                  const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.total_amount, 0);
                  
                  return (
                    <div key={dayKey} className="space-y-3">
                      {/* Day Header */}
                      <div className="flex items-center justify-between py-2 border-b border-muted">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {formatDayHeader(dayKey)}
                        </h4>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(dayTotal)}
                        </p>
                      </div>
                      
                      {/* Day Expenses */}
                      <div className="space-y-3">
                        {dayExpenses
                          .sort((a, b) => new Date(b.expense_time).getTime() - new Date(a.expense_time).getTime())
                          .map((expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                            >
                              {/* Icon */}
                              <div className="flex-shrink-0">
                                <span className="text-xl">
                                  {getCategoryIcon(expense.category)}
                                </span>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Title */}
                                <h4 className="font-medium text-sm leading-tight">
                                  {expense.category}
                                </h4>
                                
                                {/* Payment Type Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant={expense.payment_type === 'Cash' ? 'secondary' : 'outline'}
                                    className="text-xs h-5"
                                  >
                                    {expense.payment_type === 'Cash' ? '💵' : '💳'} 
                                    {expense.payment_type}
                                  </Badge>
                                  
                                  {expense.cashless_type && (
                                    <Badge variant="outline" className="text-xs h-5">
                                      {expense.cashless_type}
                                    </Badge>
                                  )}
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock size={12} className="flex-shrink-0" />
                                  <span>
                                    {formatDateInDay(expense.expense_time)}
                                    {expense.is_auto_time && ' (Auto)'}
                                  </span>
                                </div>

                                {/* Comment */}
                                {expense.comment && (
                                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <MessageCircle size={12} className="mt-0.5 flex-shrink-0" />
                                    <span className="italic leading-relaxed">{expense.comment}</span>
                                  </div>
                                )}
                              </div>

                              {/* Amount and Delete Button - Vertically Centered */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <p className="font-bold text-destructive text-sm">
                                  {formatCurrency(expense.total_amount)}
                                </p>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-6 w-6 p-0"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                      <AlertDialogDescription asChild>
                                        <div>
                                          <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
                                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                                            <strong>{expense.category}</strong> - {formatCurrency(expense.total_amount)}
                                          </div>
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteExpense(expense.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}