'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ExpenseCategory, CashlessType, ExpenseFormData } from '@/lib/types';

interface ExpenseFormProps {
  onExpenseAdded?: () => void;
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [cashlessTypes, setCashlessTypes] = useState<CashlessType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_time: new Date().toISOString().slice(0, 16),
    is_auto_time: true,
    category: '',
    payment_type: 'Cash',
    cashless_type: undefined,
    total_amount: 0,
    comment: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
    fetchCashlessTypes();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } else {
      setCategories(data || []);
    }
  };

  const fetchCashlessTypes = async () => {
    const { data, error } = await supabase
      .from('cashless_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching cashless types:', error);
      toast.error('Failed to load cashless types');
    } else {
      setCashlessTypes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to add expenses');
        return;
      }

      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }

      if (formData.payment_type === 'Cashless' && !formData.cashless_type) {
        toast.error('Please select a cashless type');
        return;
      }

      if (formData.total_amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const expenseData = {
        user_id: user.id,
        expense_time: formData.is_auto_time ? new Date().toISOString() : formData.expense_time,
        is_auto_time: formData.is_auto_time,
        category: formData.category,
        payment_type: formData.payment_type,
        cashless_type: formData.payment_type === 'Cashless' ? formData.cashless_type : null,
        total_amount: formData.total_amount,
        comment: formData.comment || null
      };

      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) {
        throw error;
      }

      toast.success('Expense added successfully!');
      
      // Reset form
      setFormData({
        expense_time: new Date().toISOString().slice(0, 16),
        is_auto_time: true,
        category: '',
        payment_type: 'Cash',
        cashless_type: undefined,
        total_amount: 0,
        comment: ''
      });

      if (onExpenseAdded) {
        onExpenseAdded();
      }

    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-time">Automatic Time</Label>
              <Switch
                id="auto-time"
                checked={formData.is_auto_time}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_auto_time: checked })
                }
              />
            </div>
            
            {!formData.is_auto_time && (
              <div>
                <Label htmlFor="expense-time">Select Time</Label>
                <Input
                  id="expense-time"
                  type="datetime-local"
                  value={formData.expense_time}
                  onChange={(e) => 
                    setFormData({ ...formData, expense_time: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => 
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={formData.payment_type}
              onValueChange={(value: 'Cash' | 'Cashless') => {
                setFormData({ 
                  ...formData, 
                  payment_type: value,
                  cashless_type: value === 'Cash' ? undefined : formData.cashless_type
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">💵 Cash</SelectItem>
                <SelectItem value="Cashless">💳 Cashless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cashless Type */}
          {formData.payment_type === 'Cashless' && (
            <div className="space-y-2">
              <Label>Cashless Type</Label>
              <Select
                value={formData.cashless_type}
                onValueChange={(value) => 
                  setFormData({ ...formData, cashless_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cashless type" />
                </SelectTrigger>
                <SelectContent>
                  {cashlessTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={formData.total_amount || ''}
                onChange={(e) => 
                  setFormData({ ...formData, total_amount: parseInt(e.target.value) || 0 })
                }
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                IDR
              </span>
            </div>
            {formData.total_amount > 0 && (
              <p className="text-sm text-gray-600">
                {formatCurrency(formData.total_amount)}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add a note about this expense..."
              value={formData.comment}
              onChange={(e) => 
                setFormData({ ...formData, comment: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}