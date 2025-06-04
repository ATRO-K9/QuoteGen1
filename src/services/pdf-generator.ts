import { Customer, Project, ServiceItem, Quotation } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

export const generateQuotationPDF = (
  quotation: Quotation, 
  customer: Customer, 
  project: Project, 
  serviceItems: ServiceItem[]
): void => {
  // This function is kept as a placeholder but doesn't generate PDFs anymore
  console.warn('PDF generation has been removed. Use print functionality instead.');
};