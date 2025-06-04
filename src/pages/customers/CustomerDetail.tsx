import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  FolderKanban,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Customer, Project, Quotation } from '../../types';
import { customerService, projectService, quotationService } from '../../services/database';

const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (id) {
        try {
          const customerData = await customerService.getById(id);
          if (customerData) {
            setCustomer(customerData);
            console.log('Customer created_at data:', customerData.created_at, typeof customerData.created_at);
            
            // Get related projects
            const customerProjects = await projectService.getByCustomerId(id);
            setProjects(customerProjects);
            
            // Get related quotations
            const customerQuotations = await quotationService.getByCustomerId(id);
            setQuotations(customerQuotations);
          } else {
            navigate('/customers'); // Redirect if customer not found
          }
        } catch (error) {
          console.error('Error fetching customer details:', error);
          navigate('/customers'); // Redirect on error
        }
      }
    };

    fetchCustomerData();
  }, [id, navigate]);
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (id) {
      customerService.delete(id);
      navigate('/customers');
    }
  };
  
  if (!customer) {
    return <div className="p-8 text-center">Loading customer details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/customers')}
          >
            {null}
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">Customer Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/customers/${id}/edit`)}
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
        {/* Customer Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <User className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-medium text-slate-900">{customer.name}</p>
                </div>
              </div>
              
              {customer.company && (
                <div className="flex items-start">
                  <Building2 className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500">Company</p>
                    <p className="font-medium text-slate-900">{customer.company}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">{customer.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">{customer.address}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Customer since {customer?.created_at ? formatDate(customer.created_at) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Button
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => navigate(`/projects/new?customerId=${id}`)}
              >
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {projects.length > 0 ? (
                projects.map(project => (
                  <div 
                    key={project.id} 
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{project.name}</h4>
                          <p className="text-sm text-slate-500">{project.description.substring(0, 50)}{project.description.length > 50 ? '...' : ''}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          project.status === 'completed' ? 'success' :
                          project.status === 'in-progress' ? 'primary' : 'warning'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p>No projects yet for this customer.</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/projects/new?customerId=${id}`)}
                  >
                    Create First Project
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Quotations */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quotations</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/quotations?customerId=${id}`)}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {quotations.length > 0 ? (
                    quotations.map(quotation => {
                      const project = projects.find(p => p.id === quotation.project_id);
                      return (
                        <tr 
                          key={quotation.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/quotations/${quotation.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-slate-900">
                                {project?.name || 'Unknown Project'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-700">
                              {formatDate(quotation.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              ${quotation.total.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                quotation.status === 'accepted' ? 'success' :
                                quotation.status === 'sent' ? 'primary' :
                                quotation.status === 'rejected' ? 'danger' : 'default'
                              }
                            >
                              {quotation.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/quotations/${quotation.id}`);
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        <p>No quotations yet for this customer.</p>
                        <Button
                          className="mt-2"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/quotations/new?customerId=${id}`)}
                        >
                          Create Quotation
                        </Button>
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
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Customer</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this customer? This action will also delete all associated projects, service items, and quotations.
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
    </div>
  );
};

export default CustomerDetail;