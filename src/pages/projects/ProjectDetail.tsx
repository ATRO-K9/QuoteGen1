import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  FolderKanban, 
  User, 
  Calendar,
  Clock,
  FileText,
  Plus,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Project, Customer, ServiceItem, Quotation } from '../../types';
import { projectService, customerService, serviceItemService, quotationService } from '../../services/database';

const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showServiceItemModal, setShowServiceItemModal] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newServiceItem, setNewServiceItem] = useState<Partial<ServiceItem>>({
    project_id: id || '',
    name: '',
    description: '',
    quantity: 1,
    price: 0
  });
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const projectData = await projectService.getById(id);
        if (projectData) {
          setProject(projectData);
          
          // Get customer
          const projectCustomer = await customerService.getById(projectData.customer_id);
          setCustomer(projectCustomer || null);
          
          // Get service items
          const projectServiceItems = await serviceItemService.getByProjectId(id);
          setServiceItems(projectServiceItems || []);
          
          // Get quotations
          const projectQuotations = await quotationService.getByProjectId(id);
          setQuotations(projectQuotations || []);
        } else {
          navigate('/projects');
        }
      } catch (error) {
        console.error('Error loading project data:', error);
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate]);
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (id) {
      projectService.delete(id);
      navigate('/projects');
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };
  
  const openServiceItemModal = (itemId?: string) => {
    if (itemId) {
      const item = serviceItems.find(i => i.id === itemId);
      if (item) {
        setNewServiceItem({
          ...item,
          project_id: id || ''
        });
        setActiveItemId(itemId);
      }
    } else {
      setNewServiceItem({
        project_id: id || '',
        name: '',
        description: '',
        quantity: 1,
        price: 0
      });
      setActiveItemId(null);
    }
    setShowServiceItemModal(true);
  };
  
  const handleServiceItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setNewServiceItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    }));
  };
  
  // Helper function to calculate quotation totals
  const calculateQuotationTotals = (items: ServiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.10; // Assuming 10% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };
  
  const saveServiceItem = async () => {
    if (!id) return;
    
    try {
      if (activeItemId) {
        // Update existing item
        await serviceItemService.update(activeItemId, newServiceItem);
      } else {
        // Create new item
        await serviceItemService.create(newServiceItem as Omit<ServiceItem, 'id' | 'createdAt'>);
      }
      
      // Refresh service items
      const updatedItems = await serviceItemService.getByProjectId(id);
      setServiceItems(updatedItems || []);
      
      // Find and update the linked quotation
      if (quotations.length > 0) {
        const linkedQuotation = quotations[0]; // Assuming only one quotation due to unique constraint
        const { subtotal, tax, total } = calculateQuotationTotals(updatedItems);
        try {
          await quotationService.update(linkedQuotation.id, { items: updatedItems, subtotal, tax, total });
          // Optionally refresh quotations state if needed
          const updatedQuotations = await quotationService.getByProjectId(id);
          setQuotations(updatedQuotations || []);
          console.log(`Linked quotation ${linkedQuotation.id} updated with new items and totals.`);
        } catch (quotationError) {
          console.error(`Error updating linked quotation ${linkedQuotation.id}:`, quotationError);
          // Optionally show a toast notification for the update failure
        }
      }
      
      // Close modal
      setShowServiceItemModal(false);
      setNewServiceItem({
        project_id: id,
        name: '',
        description: '',
        quantity: 1,
        price: 0
      });
      setActiveItemId(null);
    } catch (error) {
      console.error('Error saving service item:', error);
    }
  };
  
  const deleteServiceItem = async (itemId: string) => {
    await serviceItemService.delete(itemId);
    
    // Refresh service items
    if (id) {
      const updatedItems = await serviceItemService.getByProjectId(id);
      setServiceItems(updatedItems || []);
      
      // Find and update the linked quotation
      if (quotations.length > 0) {
        const linkedQuotation = quotations[0]; // Assuming only one quotation due to unique constraint
        const { subtotal, tax, total } = calculateQuotationTotals(updatedItems);
        try {
          await quotationService.update(linkedQuotation.id, { items: updatedItems, subtotal, tax, total });
           // Optionally refresh quotations state if needed
          const updatedQuotations = await quotationService.getByProjectId(id);
          setQuotations(updatedQuotations || []);
          console.log(`Linked quotation ${linkedQuotation.id} updated after item deletion.`);
        } catch (quotationError) {
          console.error(`Error updating linked quotation ${linkedQuotation.id} after item deletion:`, quotationError);
          // Optionally show a toast notification for the update failure
        }
      }
    }
  };
  
  const totalValue = serviceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading project details...</div>;
  }

  if (!project || !customer) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/projects')}
          >
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">Project Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/projects/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash size={16} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center">
                <FolderKanban className="h-12 w-12 text-teal-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <FolderKanban className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Project Name</p>
                  <p className="font-medium text-slate-900">{project.name}</p>
                </div>
              </div>
              
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
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="font-medium text-slate-900">{formatDate(project.start_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
              <p className="text-sm text-slate-600">{project.description}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Project created on {formatDate(project.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Service Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Service Items</CardTitle>
              <Button
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => openServiceItemModal()}
              >
                Add Item
              </Button>
            </div>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {serviceItems.length > 0 ? (
                    serviceItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-500 max-w-xs">
                            {item.description.substring(0, 50)}{item.description.length > 50 ? '...' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-slate-900">
                            {item.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-slate-900">
                            {formatCurrency(item.price, project.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {formatCurrency(item.price * item.quantity, project.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => openServiceItemModal(item.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => deleteServiceItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        <p>No service items added yet.</p>
                        <Button
                          className="mt-2"
                          variant="outline"
                          size="sm"
                          onClick={() => openServiceItemModal()}
                        >
                          Add First Service Item
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {serviceItems.length > 0 && (
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-700">
                        Total Value:
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                        {formatCurrency(totalValue, project.currency)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Quotations */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quotations</CardTitle>
              {quotations.length === 0 && (
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate(`/quotations/new?projectId=${id}`)}
                disabled={serviceItems.length === 0}
              >
                Generate Quotation
              </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Quotation #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {quotations.length > 0 ? (
                    quotations.map((quotation) => (
                      <tr 
                        key={quotation.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => navigate(`/quotations/${quotation.id}`)}
                          >
                            #{quotation.id.substring(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-700">
                            {formatDate(quotation.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-700">
                            {formatDate(quotation.valid_until)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {formatCurrency(quotation.total, project.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(quotation.status)}>
                            {quotation.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye size={14} />}
                              onClick={() => navigate(`/quotations/${quotation.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Download size={14} />}
                              onClick={() => navigate(`/quotations/${quotation.id}/download`)}
                            >
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        {serviceItems.length === 0 ? (
                          <p>Add service items first to generate quotations.</p>
                        ) : (
                          <>
                            <p>No quotations generated yet for this project.</p>
                            <Button
                              className="mt-2"
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/quotations/new?projectId=${id}`)}
                            >
                              Generate First Quotation
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Project</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this project? This action will also delete all associated service items and quotations.
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
      
      {/* Service Item Modal */}
      {showServiceItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {activeItemId ? 'Edit Service Item' : 'Add New Service Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="service-name" className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                <input
                  id="service-name"
                  type="text"
                  name="name"
                  value={newServiceItem.name || ''}
                  onChange={handleServiceItemChange}
                  className="block w-full rounded-md border border-slate-300 py-2 px-3 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newServiceItem.description || ''}
                  onChange={handleServiceItemChange}
                  className="block w-full rounded-md border border-slate-300 py-2 px-3 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={newServiceItem.quantity || ''}
                    onChange={handleServiceItemChange}
                    min="1"
                    className="block w-full rounded-md border border-slate-300 py-2 px-3 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price (per unit)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newServiceItem.price || ''}
                    onChange={handleServiceItemChange}
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border border-slate-300 py-2 px-3 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-slate-500">
                  Total: {formatCurrency((newServiceItem.price || 0) * (newServiceItem.quantity || 0), project.currency)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowServiceItemModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveServiceItem}
              >
                {activeItemId ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;