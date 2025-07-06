import { jsPDF } from 'jspdf';

export interface AutoTableOptions {
  head?: any[][];
  body?: any[][];
  startY?: number;
  styles?: any;
  headStyles?: any;
  // Add other options as needed
}

export interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => JsPDFWithAutoTable;
}

declare module 'jspdf-autotable' {
  const autoTable: (doc: JsPDFWithAutoTable, options: AutoTableOptions) => JsPDFWithAutoTable;
  export default autoTable;
}
