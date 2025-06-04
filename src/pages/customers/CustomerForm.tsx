import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/TextArea';
import { Customer } from '../../types';
import { customerService } from '../../services/database';
import { toast } from 'sonner';
import { Label } from '../../components/ui/label';

interface CustomerFormProps {
  mode: 'new' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (mode === 'edit' && id) {
        try {
          const customerData = await customerService.getById(id);
          if (customerData) {
            setFormData(customerData);
          } else {
            // If customer not found, maybe redirect or show an error
            navigate('/customers');
            toast.error('Customer not found');
          }
        } catch (error) {
          console.error('Error fetching customer for edit:', error);
          // Handle error, maybe redirect or show a message
          navigate('/customers');
          toast.error('Failed to load customer details');
        }
      }
    };

    fetchCustomerData();
  }, [mode, id, navigate]);
  
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
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'new') {
        customerService.create(formData as Omit<Customer, 'id' | 'createdAt'>);
      } else if (id) {
        customerService.update(id, formData);
      }
      
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
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
            onClick={() => navigate('/customers')}
          >
            {null}
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'new' ? 'Add New Customer' : 'Edit Customer'}
          </h2>
        </div>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div className="w-full md:w-1/2">
                <Input
                  label="Company Name (Optional)"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div className="w-full md:w-1/2">
                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Save size={16} />}
              isLoading={isSubmitting}
            >
              {mode === 'new' ? 'Create Customer' : 'Update Customer'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CustomerForm;