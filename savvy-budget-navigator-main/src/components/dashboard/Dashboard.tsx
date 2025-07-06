import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, LogOut, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface DashboardProps {
  transactions: Transaction[];
  onTransactionsChange: (transactions: Transaction[]) => void;
}

export const Dashboard = ({ transactions, onTransactionsChange }: DashboardProps) => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      } else {
        onTransactionsChange(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleTransactionAdded = async () => {
    await fetchTransactions();
    setShowTransactionForm(false);
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  };

  const { income, expenses, balance } = calculateTotals();

  // Prepare data for pie chart (recent expenses by category)
  const getExpenseData = () => {
    const categoryMap = new Map();
    
    // Get recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
      .forEach(transaction => {
        const amount = Number(transaction.amount);
        if (categoryMap.has(transaction.category)) {
          categoryMap.set(transaction.category, categoryMap.get(transaction.category) + amount);
        } else {
          categoryMap.set(transaction.category, amount);
        }
      });

    // Convert to array and sort by amount (descending)
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const expenseData = getExpenseData();
  
  // Colors for the pie chart
  const COLORS = [
    'hsl(var(--expense))',
    'hsl(var(--warning))',
    'hsl(var(--accent))',
    'hsl(var(--primary))',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Savvy Budget Navigator
            </h1>
            <p className="text-sm text-muted-foreground">Financial Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowTransactionForm(true)}
              variant="hero"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card border-0 bg-gradient-income">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">KSh {income.toLocaleString()}</div>
              <p className="text-xs text-white/80">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-expense">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">KSh {expenses.toLocaleString()}</div>
              <p className="text-xs text-white/80">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                KSh {balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Available funds</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-savings">
                {income > 0 ? Math.round((balance / income) * 100) : 0}%
              </div>
              <Progress value={income > 0 ? (balance / income) * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === "income" ? "text-income" : "text-expense"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}KSh {Number(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Spending by Category</CardTitle>
                  <CardDescription>Last 30 days expense distribution</CardDescription>
                </div>
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {expenseData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <PieChartIcon className="h-12 w-12 mb-2 opacity-50" />
                  <p>No expense data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <TransactionList 
          transactions={transactions} 
          onRefresh={fetchTransactions}
          isLoading={isLoading}
        />

      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm 
          onClose={() => setShowTransactionForm(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
    </div>
  );
};

export default Dashboard;