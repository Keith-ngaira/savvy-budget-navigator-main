import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/components/auth/AuthPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { BudgetManager } from "@/components/budget/BudgetManager";
import { FinancialCharts } from "@/components/analytics/FinancialCharts";
import { ExportData } from "@/components/analytics/ExportData";
import { GoalsManager } from "@/components/goals/GoalsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Target, PieChart, Download, Home } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Tables<"transactions">[]>([]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Budget Navigator
            </h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return user ? (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <TabsContent value="dashboard">
            <Dashboard 
              transactions={transactions}
              onTransactionsChange={setTransactions}
            />
          </TabsContent>
          <TabsContent value="budget">
            <BudgetManager transactions={transactions} />
          </TabsContent>
          <TabsContent value="analytics">
            <FinancialCharts transactions={transactions} />
          </TabsContent>
          <TabsContent value="goals">
            <GoalsManager />
          </TabsContent>
          <TabsContent value="export">
            <ExportData transactions={transactions} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ) : <AuthPage />;
};

export default Index;
