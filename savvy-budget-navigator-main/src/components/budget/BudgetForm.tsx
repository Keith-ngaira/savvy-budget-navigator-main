import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, Target } from "lucide-react";

interface BudgetFormProps {
  onClose: () => void;
  onBudgetCreated: () => void;
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other"
];

export const BudgetForm = ({ onClose, onBudgetCreated }: BudgetFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create budgets",
          variant: "destructive",
        });
        return;
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (formData.period === "weekly") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        startDate = startOfWeek;
        endDate = endOfWeek;
      } else {
        // Monthly
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const { error } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          category: formData.category,
          amount: parseFloat(formData.amount),
          period: formData.period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Budget already exists",
            description: `You already have a ${formData.period} budget for ${formData.category}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create budget",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Budget created successfully",
        });
        onBudgetCreated();
        onClose();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-md shadow-card animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Budget
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: "weekly" | "monthly") => 
                    setFormData({ ...formData, period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="hero"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};