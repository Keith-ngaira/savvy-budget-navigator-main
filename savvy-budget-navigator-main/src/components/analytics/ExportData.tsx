import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { JsPDFWithAutoTable } from "@/types/jspdf-autotable";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface ExportDataProps {
  transactions: Transaction[];
}

export const ExportData = ({ transactions }: ExportDataProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState<"all" | "month" | "quarter" | "year">("month");
  const { toast } = useToast();

  const filterTransactionsByDateRange = () => {
    if (dateRange === "all") return transactions;

    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const exportToCSV = () => {
    const filteredTransactions = filterTransactionsByDateRange();
    
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        t.date,
        t.type,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financial-data-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const filteredTransactions = filterTransactionsByDateRange();
    const doc = new jsPDF() as JsPDFWithAutoTable;

    // Title
    doc.setFontSize(20);
    doc.text("Financial Report", 20, 20);
    
    // Date range info
    doc.setFontSize(12);
    doc.text(`Report Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

    // Summary
    const totalIncome = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    doc.text(`Total Income: KSh ${totalIncome.toLocaleString()}`, 20, 60);
    doc.text(`Total Expenses: KSh ${totalExpenses.toLocaleString()}`, 20, 70);
    doc.text(`Net Balance: KSh ${(totalIncome - totalExpenses).toLocaleString()}`, 20, 80);

    // Transactions table
    const tableData = filteredTransactions.map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category,
      t.description,
      `KSh ${Number(t.amount).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 95,
      head: [["Date", "Type", "Category", "Description", "Amount"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`financial-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportType === "csv") {
        exportToCSV();
      } else {
        exportToPDF();
      }
      
      toast({
        title: "Export successful",
        description: `Your data has been exported as ${exportType.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = filterTransactionsByDateRange().length;

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportType} onValueChange={(value: "csv" | "pdf") => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="pdf">PDF (Report)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filteredCount} transactions will be exported
          </p>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting || filteredCount === 0}
          className="w-full"
          variant="hero"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export {exportType.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  );
};