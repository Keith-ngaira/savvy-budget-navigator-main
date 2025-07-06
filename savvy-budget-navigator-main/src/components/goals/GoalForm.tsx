import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, Target } from "lucide-react";

interface GoalFormProps {
  onClose: () => void;
  onGoalCreated: () => void;
}

export const GoalForm = ({ onClose, onGoalCreated }: GoalFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    target_date: ""
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
          description: "You must be logged in to create goals",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          target_amount: parseFloat(formData.target_amount),
          target_date: formData.target_date || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create goal",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Goal created successfully",
        });
        onGoalCreated();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Goal
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Save for unexpected expenses..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Target Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Target Date (Optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="savings"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Goal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};