import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  FileText, 
  User, 
  Calendar,
  FolderKanban,
  Send,
  FileCheck,
  FileX,
  Eye,
  X,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Quotation, Customer, Project, CompanySettings } from '../../types';
import { quotationService, customerService, projectService, companySettingsService } from '../../services/database';
import QuotationPreview from '../../components/quotations/QuotationPreview';

const QuotationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate('/quotations');
        return;
      }

      try {
        const quotationData = await quotationService.getById(id);
        if (!quotationData) {
          navigate('/quotations');
          return;
        }

        setQuotation(quotationData);
        
        // Get customer and project
        if (quotationData.customer_id) {
          const quotationCustomer = await customerService.getById(quotationData.customer_id);
          setCustomer(quotationCustomer || null);
        }
        
        if (quotationData.project_id) {
          const quotationProject = await projectService.getById(quotationData.project_id);
          setProject(quotationProject || null);
        }
        
        // Get company settings
        const settings = await companySettingsService.getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error loading quotation details:', error);
        navigate('/quotations');
      }
    };
    
    loadData();
  }, [id, navigate]);
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (id) {
      quotationService.delete(id);
      navigate('/quotations');
    }
  };
  
  const handlePreviewPDF = () => {
    setShowPreviewModal(true);
  };

  const printQuotation = () => {
    const element = document.getElementById("quotation-preview");
    if (!element) {
      alert("Element with ID 'quotation-preview' not found.");
      return;
    }

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      alert("Unable to open print window. Please check if pop-ups are blocked.");
      return;
    }
    
    const styleContent = Array.from(document.styleSheets).map(sheet => {
      try {
        return Array.from(sheet.cssRules || []).map(rule => rule.cssText).join('\n');
      } catch (e) {
        return ''; // Ignore cross-origin styles
      }
    }).join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation</title>
          <style>
            body { margin: 0; padding: 40px; font-family: sans-serif; background: white; }
            ${styleContent}
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>
            window.onload = function() {
              window.print();
            }
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  const updateQuotationStatus = async (status: 'draft' | 'sent' | 'accepted' | 'rejected') => {
    if (id) {
      try {
        await quotationService.update(id, { status });
        
        // If quotation is accepted, update related project status to 'in-progress'
        if (status === 'accepted' && quotation && quotation.project_id) {
          try {
            await projectService.update(quotation.project_id, { status: 'in-progress' });
            console.log(`Project ${quotation.project_id} status updated to in-progress.`);
          } catch (projectError) {
            console.error(`Error updating project status for project ${quotation.project_id}:`, projectError);
            // Optionally, show a toast notification for the project update failure
          }
        }
        
        // Refresh quotation
        const updatedQuotation = await quotationService.getById(id);
        if (updatedQuotation) {
          setQuotation(updatedQuotation);
        }
      } catch (error) {
        console.error('Error updating quotation status:', error);
      }
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'sent': return 'primary';
      case 'rejected': return 'danger';
      case 'draft': default: return 'secondary';
    }
  };
  
  if (!quotation) {
    return <div className="p-8 text-center">Loading quotation details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/quotations')}
          >
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">Quotation Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/quotations/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye size={16} />}
            onClick={handlePreviewPDF}
          >
            Preview & Print
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash size={16} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quotation Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-12 w-12 text-purple-600" />
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold text-slate-900">
                #{quotation.id ? quotation.id.substring(0, 8).toUpperCase() : 'N/A'}
              </h3>
              <Badge 
                variant={getStatusBadgeVariant(quotation.status)}
                className="mt-2"
              >
                {quotation.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {customer && (
                <div className="flex items-start">
                  <User className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p 
                      className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      {customer.name}
                    </p>
                  </div>
                </div>
              )}
              
              {project && (
                <div className="flex items-start">
                  <FolderKanban className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500">Project</p>
                    <p 
                      className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      {project.name}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium text-slate-900">{formatDate(quotation.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Valid Until</p>
                  <p className="font-medium text-slate-900">{formatDate(quotation.valid_until)}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">Subtotal:</span>
                <span className="font-medium text-slate-900">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">Tax (10%):</span>
                <span className="font-medium text-slate-900">{formatCurrency(quotation.tax, quotation.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                <span className="text-base font-semibold text-slate-900">Total:</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(quotation.total, quotation.currency)}</span>
              </div>
            </div>
            
            {/* Quotation Actions */}
            {quotation.status === 'draft' && (
              <div className="pt-4 border-t border-slate-100">
                <Button
                  className="w-full"
                  icon={<Send size={16} />}
                  onClick={() => updateQuotationStatus('sent')}
                >
                  Mark as Sent
                </Button>
              </div>
            )}
            
            {quotation.status === 'sent' && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Button
                  className="w-full"
                  variant="primary"
                  icon={<FileCheck size={16} />}
                  onClick={() => updateQuotationStatus('accepted')}
                >
                  Mark as Accepted
                </Button>
                <Button
                  className="w-full"
                  variant="danger"
                  icon={<FileX size={16} />}
                  onClick={() => updateQuotationStatus('rejected')}
                >
                  Mark as Rejected
                </Button>
              </div>
            )}
            
            {(quotation.status === 'accepted' || quotation.status === 'rejected') && (
              <div className="pt-4 border-t border-slate-100">
                <Button
                  className="w-full"
                  variant="outline"
                  icon={<Send size={16} />}
                  onClick={() => updateQuotationStatus('sent')}
                >
                  Return to Sent Status
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Service Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {quotation.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 max-w-xs">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-slate-900">
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-slate-900">
                          {formatCurrency(item.price, quotation.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(item.price * item.quantity, quotation.currency)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-700">
                      Subtotal:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(quotation.subtotal, quotation.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-700">
                      Tax (10%):
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(quotation.tax, quotation.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                      Total:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(quotation.total, quotation.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Notes and Terms */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Terms & Conditions</h3>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 min-h-[100px]">
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {quotation.terms}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Notes</h3>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 min-h-[100px]">
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {quotation.notes || 'No additional notes.'}
                  </p>
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Quotation</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 flex flex-col h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Quotation Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {quotation && customer && project && (
                <QuotationPreview
                  quotation={quotation}
                  customer={customer}
                  project={project}
                  companySettings={companySettings}
                />
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Close
              </Button>
              <Button
                icon={<Printer size={16} />}
                onClick={printQuotation}
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetail;