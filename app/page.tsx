'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, List } from 'lucide-react';
import ExpenseForm from '@/components/expense-form';
import ExpenseList from '@/components/expense-list';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('add');

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list'); // Switch to list view after adding
  };

  return (
    <div className="min-h-screen bg-background py-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your daily expenses easily</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle size={16} />
              Add Expense
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List size={16} />
              View Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-0">
            <ExpenseForm onExpenseAdded={handleExpenseAdded} />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ExpenseList refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
