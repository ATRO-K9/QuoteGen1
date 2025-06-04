import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import { Project, Customer } from '../../types';
import { projectService, customerService } from '../../services/database';

interface ProjectFormProps {
  mode: 'new' | 'edit';
}

const ProjectForm: React.FC<ProjectFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(location.search);
  const customerIdFromUrl = queryParams.get('customerId');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    customer_id: customerIdFromUrl || '',
    name: '',
    description: '',
    start_date: new Date(),
    status: 'pending',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers
        const loadedCustomers = await customerService.getAll();
        setCustomers(loadedCustomers);
        
        if (mode === 'edit' && id) {
          const project = await projectService.getById(id);
          if (project) {
            // Format date for input
            const formattedProject = {
              ...project,
              start_date: new Date(project.start_date),
              currency: project.currency
            };
            
            setFormData(formattedProject);
          } else {
            navigate('/projects');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setCustomers([]);
      }
    };

    loadData();
  }, [mode, id, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      customer_id: value
    }));
    
    if (errors.customer_id) {
      setErrors(prev => ({ ...prev, customer_id: '' }));
    }
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as Project['status']
    }));
  };
  
  const handleCurrencyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      currency: value as Project['currency']
    }));
    
    if (errors.currency) {
      setErrors(prev => ({ ...prev, currency: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
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
      // Safely convert start_date to a Date object
      const startDate = formData.start_date ? 
        (formData.start_date instanceof Date ? formData.start_date : new Date(formData.start_date)) 
        : new Date();

      const projectData = {
        customer_id: formData.customer_id,
        name: formData.name,
        description: formData.description,
        start_date: startDate,
        status: formData.status,
        currency: formData.currency
      };
      
      if (mode === 'new') {
        await projectService.create(projectData as Omit<Project, 'id' | 'created_at'>);
      } else if (id) {
        await projectService.update(id, projectData as Partial<Project>);
      }
      
      navigate('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save project. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/projects')}
          >
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'new' ? 'Add New Project' : 'Edit Project'}
          </h2>
        </div>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                required
              />
              {customers.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No customers available. <a href="/customers/new\" className="text-blue-600 hover:underline">Add a customer</a> first.
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <Input
                id="project-name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                error={errors.name}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <Input
                  id="start-date"
                  type="date"
                  name="start_date"
                  value={formData.start_date instanceof Date ? formData.start_date.toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  error={errors.start_date}
                  required
                />
              </div>
              <div className="w-full md:w-1/2">
                <Select
                  label="Status"
                  name="status"
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  value={formData.status || 'pending'}
                  onChange={handleStatusChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <Select
                label="Currency"
                name="currency"
                options={[
                  { value: 'LKR', label: 'LKR' },
                  { value: 'USD', label: 'USD' },
                  { value: 'AUD', label: 'AUD' }
                ]}
                value={formData.currency || 'LKR'}
                onChange={handleCurrencyChange}
                error={errors.currency}
                required
                disabled={mode === 'edit'}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Save size={16} />}
              isLoading={isSubmitting}
              disabled={customers.length === 0}
            >
              {mode === 'new' ? 'Create Project' : 'Update Project'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProjectForm;