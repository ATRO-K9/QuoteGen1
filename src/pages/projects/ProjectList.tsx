import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, FolderKanban, MoreHorizontal, Trash, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { Project, Customer } from '../../types';
import { projectService, customerService } from '../../services/database';
import { formatDate } from '../../lib/utils';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerIdFromUrl = queryParams.get('customerId');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState(customerIdFromUrl || 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({ delete: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadData();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const loadData = async () => {
    try {
      const loadedProjects = await projectService.getAll();
      const loadedCustomers = await customerService.getAll();
      setProjects(loadedProjects);
      setCustomers(loadedCustomers);
    } catch (error) {
      console.error('Error loading data:', error);
      setProjects([]);
      setCustomers([]);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  
  const handleCustomerFilter = (value: string) => {
    setCustomerFilter(value);
    setCurrentPage(1);
  };
  
  const filteredProjects = projects.filter(project => {
    const customer = customers.find(c => c.id === project.customer_id);
    
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || project.customer_id === customerFilter;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        setIsLoading(true);
        await projectService.delete(projectToDelete);
        await loadData(); // Wait for data to reload
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error('Error deleting project:', error);
        setErrors(prev => ({
          ...prev,
          delete: 'Failed to delete project. Please try again.'
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
        <Button
          onClick={() => navigate('/projects/new')}
          icon={<Plus size={16} />}
        >
          Add Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={handleSearch}
          icon={<Search size={16} className="text-slate-400" />}
        />
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' }
          ]}
          value={statusFilter}
          onChange={handleStatusFilter}
        />
        <Select
          options={[
            { value: 'all', label: 'All Customers' },
            ...customers.map(customer => ({
              value: customer.id,
              label: customer.name
            }))
          ]}
          value={customerFilter}
          onChange={handleCustomerFilter}
        />
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {currentProjects.length > 0 ? (
                  currentProjects.map((project) => {
                    const customer = customers.find(c => c.id === project.customer_id);
                    return (
                      <tr 
                        key={project.id} 
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-teal-100 flex items-center justify-center">
                              <FolderKanban className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">
                                {project.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {project.description.substring(0, 40)}{project.description.length > 40 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm text-slate-700 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/customers/${project.customer_id}`)}
                          >
                            {customer?.name || 'Unknown Customer'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700">
                            {formatDate(project.start_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(project.status)}>
                            {project.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleDropdown(project.id, e)}
                              icon={<MoreHorizontal size={16} />}
                            >
                              Actions
                            </Button>
                            
                            {activeDropdown === project.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 dropdown-menu">
                                <div className="py-1">
                                  <button
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <Eye size={16} className="mr-2" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <Edit size={16} className="mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(project.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                                  >
                                    <Trash size={16} className="mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      {searchTerm || statusFilter !== 'all' || customerFilter !== 'all'
                        ? 'No projects found matching your search criteria.'
                        : 'No projects added yet. Add your first project!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {filteredProjects.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-slate-700">
                <span className="mr-2">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  icon={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
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

export default ProjectList;