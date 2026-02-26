"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ExportButton({ data, filename = "inventory_report.csv" }: { data: any[], filename?: string }) {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    // Define headers
    const headers = ["Fruit Name", "Unit Type", "Total Purchased", "Total Sold", "Status", "Difference"];
    
    // Map data to rows
    const rows = data.map(item => [
      item.name,
      item.unitType,
      item.totalBuy,
      item.totalSell,
      item.status,
      item.diff
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
      <Download size={14} />
      Export CSV
    </Button>
  );
}
