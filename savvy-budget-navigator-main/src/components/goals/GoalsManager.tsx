import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Trophy, Calendar, DollarSign } from "lucide-react";
import { GoalForm } from "./GoalForm";
import type { Tables } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;

export const GoalsManager = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch goals",
          variant: "destructive",
        });
      } else {
        setGoals(data || []);
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

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from("goals")
        .update({ 
          current_amount: newAmount,
          is_completed: newAmount >= goals.find(g => g.id === goalId)?.target_amount
        })
        .eq("id", goalId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update goal progress",
          variant: "destructive",
        });
      } else {
        fetchGoals();
        toast({
          title: "Progress updated",
          description: "Goal progress has been updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete goal",
          variant: "destructive",
        });
      } else {
        fetchGoals();
        toast({
          title: "Goal deleted",
          description: "Goal has been deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
    const daysLeft = goal.target_date ? 
      Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (goal.is_completed) return { variant: "default" as const, text: "Completed", color: "text-income" };
    if (daysLeft && daysLeft < 0) return { variant: "destructive" as const, text: "Overdue", color: "text-expense" };
    if (progress >= 75) return { variant: "default" as const, text: "Almost There", color: "text-savings" };
    if (progress >= 50) return { variant: "secondary" as const, text: "On Track", color: "text-primary" };
    return { variant: "secondary" as const, text: "Just Started", color: "text-muted-foreground" };
  };

  if (isLoading) {
    return (
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground text-center py-8">
            Loading goals...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Savings Goals
            </div>
            <Button
              onClick={() => setShowGoalForm(true)}
              variant="savings"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No goals set</h3>
              <p className="text-muted-foreground mb-4">
                Set savings goals to track your financial achievements
              </p>
              <Button onClick={() => setShowGoalForm(true)} variant="savings">
                <Plus className="h-4 w-4" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {goals.map((goal) => {
                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                const status = getGoalStatus(goal);
                const daysLeft = goal.target_date ? 
                  Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                  <div
                    key={goal.id}
                    className={`p-6 rounded-lg border bg-card/50 hover:bg-card transition-all duration-300 animate-scale-in ${
                      goal.is_completed ? 'border-income/50 bg-income/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{goal.name}</h4>
                          {goal.is_completed && <Trophy className="h-5 w-5 text-income" />}
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>KSh {Number(goal.current_amount).toLocaleString()} / KSh {Number(goal.target_amount).toLocaleString()}</span>
                          </div>
                          {goal.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {daysLeft !== null ? 
                                  (daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`) :
                                  new Date(goal.target_date).toLocaleDateString()
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={status.variant} className="animate-fade-in">
                        {status.text}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-3 ${goal.is_completed ? 'animate-pulse-glow' : ''}`}
                      />
                      <div className="flex justify-between text-sm">
                        <span className={status.color}>
                          {progress.toFixed(1)}% complete
                        </span>
                        <span className="text-muted-foreground">
                          ${(Number(goal.target_amount) - Number(goal.current_amount)).toLocaleString()} remaining
                        </span>
                      </div>
                    </div>

                    {!goal.is_completed && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const amount = prompt("Add amount to goal:", "0");
                            if (amount && !isNaN(Number(amount))) {
                              updateGoalProgress(goal.id, Number(goal.current_amount) + Number(amount));
                            }
                          }}
                        >
                          Add Progress
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this goal?")) {
                              deleteGoal(goal.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showGoalForm && (
        <GoalForm
          onClose={() => setShowGoalForm(false)}
          onGoalCreated={fetchGoals}
        />
      )}
    </>
  );
};