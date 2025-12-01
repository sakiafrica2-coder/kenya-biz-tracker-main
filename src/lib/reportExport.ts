import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from './currency';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export const exportToPDF = (reportData: ReportData, companyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Profit & Loss Report', 14, 20);
  doc.setFontSize(12);
  doc.text(companyName, 14, 30);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [['Item', 'Amount']],
    body: [
      ['Total Revenue', formatCurrency(reportData.totalRevenue)],
      ['Total Expenses', formatCurrency(reportData.totalExpenses)],
      ['Gross Profit', formatCurrency(reportData.grossProfit)],
      ['Net Profit', formatCurrency(reportData.netProfit)],
      ['Profit Margin', `${reportData.profitMargin.toFixed(2)}%`],
    ],
  });

  doc.save(`Profit_Loss_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (reportData: ReportData, companyName: string) => {
  const data = [
    ['Profit & Loss Report'],
    [companyName],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['Item', 'Amount'],
    ['Total Revenue', reportData.totalRevenue],
    ['Total Expenses', reportData.totalExpenses],
    ['Gross Profit', reportData.grossProfit],
    ['Net Profit', reportData.netProfit],
    ['Profit Margin (%)', reportData.profitMargin.toFixed(2)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'P&L Report');
  XLSX.writeFile(wb, `Profit_Loss_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
