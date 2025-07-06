import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  Legend 
} from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface FinancialChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--income))',
  'hsl(var(--expense))',
  'hsl(var(--savings))',
  'hsl(var(--warning))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300'
];

export const FinancialCharts = ({ transactions }: FinancialChartsProps) => {
  // Expense by category data
  const expensesByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Monthly trends data
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, income: 0, expenses: 0 };
    }
    
    if (transaction.type === "income") {
      acc[monthKey].income += Number(transaction.amount);
    } else {
      acc[monthKey].expenses += Number(transaction.amount);
    }
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number }>);

  const trendData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6) // Last 6 months
    .map(item => ({
      ...item,
      balance: item.income - item.expenses,
      month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));

  // Weekly spending data
  const weeklyData = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const week = getWeekKey(date);
      acc[week] = (acc[week] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  const barData = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8) // Last 8 weeks
    .map(([week, amount]) => ({
      week: week.replace('-W', ' W'),
      amount
    }));

  return (
    <div className="space-y-6">
      {/* Expense Categories Pie Chart */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Spending by Category
          </CardTitle>
          <CardDescription>
            Your expense distribution across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Category Breakdown</h4>
                {pieData
                  .sort((a, b) => b.value - a.value)
                  .map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="secondary">
                        KSh {item.value.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expense data available for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends Line Chart */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Trends
          </CardTitle>
          <CardDescription>
            Your income, expenses, and balance over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `KSh ${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--income))" 
                    strokeWidth={3}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--expense))" 
                    strokeWidth={3}
                    name="Expenses"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Not enough data for trend analysis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Spending Bar Chart */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Weekly Spending Pattern
          </CardTitle>
          <CardDescription>
            Your spending habits over the last 8 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={(value) => `KSh ${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No weekly spending data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}