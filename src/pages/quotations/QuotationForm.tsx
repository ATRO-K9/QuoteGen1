import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import { Quotation, Project, Customer, ServiceItem } from '../../types';
import { quotationService, projectService, customerService, serviceItemService } from '../../services/database';
import { formatCurrency } from '../../lib/utils';

interface QuotationFormProps {
  mode: 'new' | 'edit';
}

const QuotationForm: React.FC<QuotationFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(location.search);
  const projectIdFromUrl = queryParams.get('projectId');
  const customerIdFromUrl = queryParams.get('customerId');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allServiceItems, setAllServiceItems] = useState<ServiceItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ServiceItem[]>([]);
  
  const [formData, setFormData] = useState<Partial<Quotation>>({
    project_id: '',
    customer_id: '',
    date: new Date(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: 'Please review the quotation details above. Let us know if you have any questions.',
    terms: '1. 50% deposit required before work begins.\n2. Remaining balance due upon project completion.\n3. Revisions limited to two rounds per deliverable.\n4. Additional revisions billed at hourly rate.',
    status: 'draft',
    currency: 'USD'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers and projects
        const loadedCustomers = await customerService.getAll();
        setCustomers(loadedCustomers || []);
        
        const loadedProjects = await projectService.getAll();
        setProjects(loadedProjects || []);
        
        const loadedServiceItems = await serviceItemService.getAll();
        setAllServiceItems(loadedServiceItems || []);
        
        if (mode === 'edit' && id) {
          const quotation = await quotationService.getById(id);
          if (quotation) {
            // Format dates for input
            const formattedQuotation = {
              ...quotation,
              date: new Date(quotation.date),
              valid_until: new Date(quotation.valid_until)
            };
            
            setFormData(formattedQuotation);
            setSelectedItems(quotation.items || []);
            setIsEditingExisting(true);
          } else {
            navigate('/quotations');
          }
        } else if (mode === 'new') {
          // If project ID is provided, check if a quotation already exists
          if (projectIdFromUrl) {
            const existingQuotations = await quotationService.getByProjectId(projectIdFromUrl);
            if (existingQuotations && existingQuotations.length > 0) {
              // If quotation exists, load it and switch to edit mode internally
              const existingQuotation = existingQuotations[0];
              const formattedQuotation = {
                ...existingQuotation,
                date: new Date(existingQuotation.date),
                valid_until: new Date(existingQuotation.valid_until)
              };
              setFormData(formattedQuotation);
              setSelectedItems(existingQuotation.items || []);
              setIsEditingExisting(true);
              console.log('Loaded existing quotation for project.');
            } else {
              // No existing quotation, initialize for new
            const projectItems = (loadedServiceItems || []).filter(item => item.project_id === projectIdFromUrl);
            setSelectedItems(projectItems);
            
            // If project has a customer, pre-select it
            const selectedProject = (loadedProjects || []).find(p => p.id === projectIdFromUrl);
            if (selectedProject) {
              setFormData(prev => ({
                ...prev,
                customer_id: selectedProject.customer_id,
                currency: selectedProject.currency
              }));
            }
            
            // Calculate totals
            calculateTotals(projectItems);
              setIsEditingExisting(false);
            }
          } else if (customerIdFromUrl) {
            // If customer ID is provided, filter projects for that customer
            const customerProjects = (loadedProjects || []).filter(p => p.customer_id === customerIdFromUrl);
            setProjects(customerProjects);
            setIsEditingExisting(false);
          } else {
            setIsEditingExisting(false);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        navigate('/quotations');
      }
    };
    
    loadData();
  }, [mode, id, projectIdFromUrl, customerIdFromUrl, navigate]);
  
  const calculateTotals = (items: ServiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // Assuming 10% tax rate
    const total = subtotal + tax;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
      items
    }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleCustomerChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      customer_id: value,
      project_id: '' // Reset project when customer changes
    }));
    
    if (errors.customer_id) {
      setErrors(prev => ({ ...prev, customer_id: '' }));
    }
    
    // Filter projects for selected customer
    if (value) {
      const customerProjects = projects.filter(p => p.customer_id === value);
      setProjects(customerProjects);
    } else {
      // Reset to all projects
      projectService.getAll().then(loadedProjects => {
        setProjects(loadedProjects || []);
      });
    }
  };
  
  const handleProjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      project_id: value
    }));
    
    if (errors.project_id) {
      setErrors(prev => ({ ...prev, project_id: '' }));
    }
    
    // Load service items for selected project
    if (value) {
      const projectItems = allServiceItems.filter(item => item.project_id === value);
      setSelectedItems(projectItems);
      calculateTotals(projectItems);

      // Find the selected project to update currency
      const selectedProject = projects.find(p => p.id === value);
      if (selectedProject) {
        setFormData(prev => ({
          ...prev,
          currency: selectedProject.currency
        }));
      }

    } else {
      setSelectedItems([]);
      calculateTotals([]);
    }
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as Quotation['status']
    }));
  };
  
  const updateServiceItemQuantity = (itemId: string, quantity: number) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    
    setSelectedItems(updatedItems);
    calculateTotals(updatedItems);
  };
  
  const removeServiceItem = (itemId: string) => {
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    setSelectedItems(updatedItems);
    calculateTotals(updatedItems);
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    }
    
    if (selectedItems.length === 0) {
      newErrors.items = 'At least one service item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Safely convert date objects
      const quotationDate = formData.date ?
        (formData.date instanceof Date ? formData.date : new Date(formData.date))
        : new Date();
      const validUntilDate = formData.valid_until ?
        (formData.valid_until instanceof Date ? formData.valid_until : new Date(formData.valid_until))
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days

      // Ensure we have the latest project data for currency if creating from project
      let finalCurrency = formData.currency; // Start with current formData currency
      if (mode === 'new' && projectIdFromUrl) {
        const project = projects.find(p => p.id === projectIdFromUrl);
        if (project) {
          finalCurrency = project.currency; // Use project currency if available and creating from project
        }
      }

      const quotationData = {
        project_id: formData.project_id,
        customer_id: formData.customer_id,
        date: quotationDate,
        valid_until: validUntilDate,
        items: formData.items || [],
        subtotal: formData.subtotal || 0,
        tax: formData.tax || 0,
        total: formData.total || 0,
        notes: formData.notes,
        terms: formData.terms,
        status: formData.status || 'draft',
        currency: finalCurrency // Use the determined currency
      };

      console.log('Quotation data being sent to DB:', quotationData);

      if (mode === 'new' && !isEditingExisting) {
        // Create new quotation only if not editing an existing one
        await quotationService.create(quotationData as Omit<Quotation, 'id' | 'created_at'>);
      } else if ((mode === 'edit' && id) || (mode === 'new' && isEditingExisting && formData.id)) {
        // Update existing quotation if in edit mode or if a new form loaded an existing quotation
        // Use formData directly here as it should be correctly populated for edits
        await quotationService.update(formData.id!, formData);
      }

      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = formData.customer_id 
    ? projects.filter(p => p.customer_id === formData.customer_id)
    : projects;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{mode === 'new' ? 'New Quotation' : 'Edit Quotation'}</h1>
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/quotations')}>
          Back
        </Button>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Quotation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Customer"
                  name="customer_id"
                  options={[
                    { value: '', label: 'Select a customer' },
                    ...customers.map(customer => ({
                      value: customer.id,
                      label: customer.name
                    }))
                  ]}
                  value={formData.customer_id || ''}
                  onChange={handleCustomerChange}
                  error={errors.customer_id}
                  disabled={mode === 'edit'}
                  required
                />
              </div>
              
              <div>
                <Select
                  label="Project"
                  name="project_id"
                  options={[
                    { value: '', label: 'Select a project' },
                    ...filteredProjects.map(project => ({
                      value: project.id,
                      label: project.name
                    }))
                  ]}
                  value={formData.project_id || ''}
                  onChange={handleProjectChange}
                  error={errors.project_id}
                  disabled={mode === 'edit' || !formData.customer_id}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Date"
                  type="date"
                  name="date"
                  value={formData.date?.toISOString().split('T')[0] || ''}
                  onChange={handleChange}
                  error={errors.date}
                  required
                />
              </div>
              
              <div>
                <Input
                  label="Valid Until"
                  type="date"
                  name="valid_until"
                  value={formData.valid_until?.toISOString().split('T')[0] || ''}
                  onChange={handleChange}
                  error={errors.valid_until}
                  required
                />
              </div>
              
              <div>
                <Select
                  label="Status"
                  name="status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'rejected', label: 'Rejected' }
                  ]}
                  value={formData.status || 'draft'}
                  onChange={handleStatusChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Service Items</h3>
              
              {errors.items && (
                <p className="text-sm text-red-600 mb-2">{errors.items}</p>
              )}
              
              <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                <table className="w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {selectedItems.length > 0 ? (
                      selectedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-500 max-w-xs">
                              {item.description ? (
                                <>
                                  {item.description.substring(0, 40)}
                                  {item.description.length > 40 ? '...' : ''}
                                </>
                              ) : (
                                'No description'
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateServiceItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 text-right rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-slate-900">
                              {formatCurrency(item.price, formData.currency)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-slate-900">
                              {formatCurrency(item.price * item.quantity, formData.currency)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => removeServiceItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          {formData.project_id ? (
                            <p>No service items found for this project. Add service items to the project first.</p>
                          ) : (
                            <p>Select a project to load its service items.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {selectedItems.length > 0 && (
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                          Subtotal:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(formData.subtotal || 0, formData.currency)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                          Tax (10%):
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(formData.tax || 0, formData.currency)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                          {formatCurrency(formData.total || 0, formData.currency)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Additional notes for the customer..."
                />
              </div>
              
              <div>
                <label htmlFor="terms" className="block text-sm font-medium text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <Textarea
                  id="terms"
                  name="terms"
                  value={formData.terms || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/quotations')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Save size={16} />}
              isLoading={isSubmitting}
              disabled={selectedItems.length === 0}
            >
              {mode === 'new' ? 'Generate Quotation' : 'Update Quotation'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default QuotationForm;