import React from 'react';
import { Quotation, Customer, Project, CompanySettings } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface QuotationPreviewProps {
  quotation: Quotation;
  customer: Customer;
  project: Project;
  companySettings: CompanySettings | null;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  customer,
  project,
  companySettings,
}) => {
  return (
    <div id="quotation-preview" className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto font-sans print:shadow-none print:p-0">
      <div className="flex justify-between items-center border-b pb-6 mb-6 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quotation</h1>
          <p className="text-sm text-slate-500">#{quotation.id.substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          {companySettings?.logo_url && (
            <img src={companySettings.logo_url} alt={companySettings?.name || 'Company Logo'} className="block h-12 w-auto mb-2 ml-auto" />
          )}
          <h2 className="text-xl font-semibold text-slate-700">{companySettings?.name || 'Your Company Name'}</h2>
          {companySettings?.address && <p className="text-sm text-slate-500">{companySettings.address}</p>}
          {companySettings?.phone && <p className="text-sm text-slate-500">{companySettings.phone}</p>}
          {companySettings?.email && <p className="text-sm text-slate-500">{companySettings.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Bill To:</h3>
          <p className="font-medium text-slate-800">{customer.name}</p>
          <p className="text-sm text-slate-600">{customer.email}</p>
          {customer.address && <p className="text-sm text-slate-600">{customer.address}</p>}
          {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
        </div>
        <div className="text-right">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Quotation Details:</h3>
          <p className="text-sm text-slate-600"><strong>Quotation Date:</strong> {formatDate(quotation.date)}</p>
          <p className="text-sm text-slate-600"><strong>Valid Until:</strong> {formatDate(quotation.valid_until)}</p>
          <p className="text-sm text-slate-600"><strong>Project:</strong> {project.name}</p>
          <p className="text-sm text-slate-600"><strong>Status:</strong> {quotation.status.toUpperCase()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Service Items:</h3>
        <div className="bg-blue-100 p-4 rounded-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-sm font-medium text-slate-600 py-2">Service</th>
                
                <th className="text-right text-sm font-medium text-slate-600 py-2 w-16">Qty</th>
                <th className="text-right text-sm font-medium text-slate-600 py-2 w-24">Price</th>
                <th className="text-right text-sm font-medium text-slate-600 py-2 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-slate-100">
                  <td className="py-3 text-sm text-slate-800">
                    <div>{item.name}</div>
                    {item.description && <div className="mt-2.5 text-sm text-slate-600">{item.description}</div>}
                  </td>
                  
                  <td className="py-3 text-sm text-slate-600 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-slate-600 text-right">{formatCurrency(item.price, quotation.currency)}</td>
                  <td className="py-3 text-sm text-slate-800 text-right">{formatCurrency(item.price * item.quantity, quotation.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div></div>
        <div className="text-right">
          <div className="bg-blue-100 p-4 rounded-md inline-block w-[300px]">
            <div className="text-right space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Subtotal:</span>
                <span className="font-medium text-slate-800">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Tax (10%):</span>
                <span className="font-medium text-slate-800">{formatCurrency(quotation.tax, quotation.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2 border-slate-200">
                <span className="text-base font-semibold text-slate-800">Total:</span>
                <span className="text-2xl font-bold text-slate-900">{formatCurrency(quotation.total, quotation.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {quotation.notes && (
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Notes:</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}

      {quotation.terms && (
        <div className="border-t pt-6 border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Terms & Conditions:</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.terms}</p>
        </div>
      )}

      <div className="text-center mt-10 text-sm text-slate-500">
        Thank you for your business.
      </div>
    </div>
  );
};

export default QuotationPreview;