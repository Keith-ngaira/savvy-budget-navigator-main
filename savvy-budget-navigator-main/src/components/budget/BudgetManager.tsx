import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, AlertTriangle, PieChart as PieChartIcon } from "lucide-react";
import { BudgetForm } from "./BudgetForm";
import type { Tables } from "@/integrations/supabase/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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

type Budget = Tables<"budgets">;
type Transaction = Tables<"transactions">;

interface BudgetManagerProps {
  transactions: Transaction[];
}

export const BudgetManager = ({ transactions }: BudgetManagerProps) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch budgets",
          variant: "destructive",
        });
      } else {
        setBudgets(data || []);
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

  const calculateBudgetProgress = (budget: Budget) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const spent = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.category === budget.category &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const percentage = (spent / Number(budget.amount)) * 100;
    return { spent, percentage: Math.min(percentage, 100) };
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { variant: "destructive" as const, text: "Over Budget" };
    if (percentage >= 80) return { variant: "destructive" as const, text: "Alert" };
    if (percentage >= 60) return { variant: "secondary" as const, text: "Warning" };
    return { variant: "default" as const, text: "On Track" };
  };

  if (isLoading) {
    return (
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground text-center py-8">
            Loading budgets...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart
  const pieData = budgets.map(budget => {
    const { spent } = calculateBudgetProgress(budget);
    return {
      name: budget.category,
      value: Number(budget.amount),
      spent: spent,
      remaining: Math.max(0, Number(budget.amount) - spent)
    };
  });

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Budget Distribution
            </div>
          </CardTitle>
          <CardDescription>
            Visual representation of your budget allocation across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `KSh ${value.toLocaleString()}`,
                      name === 'value' ? 'Budgeted' : name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No budget data available for visualization
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Manager
            </div>
            <Button
              onClick={() => setShowBudgetForm(true)}
              variant="hero"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Set Budget
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-4">
                Start by setting budgets for your spending categories
              </p>
              <Button onClick={() => setShowBudgetForm(true)} variant="hero">
                <Plus className="h-4 w-4" />
                Create Your First Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const { spent, percentage } = calculateBudgetProgress(budget);
                const status = getBudgetStatus(percentage);
                
                return (
                  <div
                    key={budget.id}
                    className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors animate-scale-in"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{budget.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          KSh {spent.toLocaleString()} / KSh {Number(budget.amount).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="animate-fade-in">
                        {percentage >= 100 && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {status.text}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={percentage} 
                        className={`h-3 ${percentage >= 80 ? 'animate-pulse-glow' : ''}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(1)}% used</span>
                        <span>KSh {(Number(budget.amount) - spent).toLocaleString()} remaining</span>
                      </div>
                    </div>

                    {percentage >= 80 && (
                      <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-warning">
                          {percentage >= 100 
                            ? `You've exceeded your budget by KSh ${(spent - Number(budget.amount)).toLocaleString()}`
                            : `You're approaching your budget limit`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showBudgetForm && (
        <BudgetForm
          onClose={() => setShowBudgetForm(false)}
          onBudgetCreated={fetchBudgets}
        />
      )}
    </div>
  );
};