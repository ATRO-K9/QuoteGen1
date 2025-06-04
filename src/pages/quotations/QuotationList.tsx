import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, FileText, MoreHorizontal, Trash, Edit, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { Quotation, Project, Customer } from '../../types';
import { quotationService, projectService, customerService } from '../../services/database';
import { formatDate, formatCurrency } from '../../lib/utils';

const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectIdFromUrl = queryParams.get('projectId');
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl || 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      const loadedQuotations = await quotationService.getAll();
      const loadedProjects = await projectService.getAll();
      const loadedCustomers = await customerService.getAll();
      setQuotations(loadedQuotations);
      setProjects(loadedProjects);
      setCustomers(loadedCustomers);
    } catch (error) {
      console.error('Error loading data:', error);
      setQuotations([]);
      setProjects([]);
      setCustomers([]);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  
  const handleProjectFilter = (value: string) => {
    setProjectFilter(value);
    setCurrentPage(1);
  };
  
  const filteredQuotations = quotations.filter(quotation => {
    const project = projects.find(p => p.id === quotation.project_id);
    const customer = project ? customers.find(c => c.id === project.customer_id) : null;
    
    const matchesSearch = quotation.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesProject = projectFilter === 'all' || quotation.project_id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleDelete = (id: string) => {
    setQuotationToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (quotationToDelete) {
      try {
        await quotationService.delete(quotationToDelete);
        await loadData();
        setShowDeleteModal(false);
        setQuotationToDelete(null);
      } catch (error) {
        console.error('Error deleting quotation:', error);
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
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Quotations</h2>
        <Button
          onClick={() => navigate('/quotations/new')}
          icon={<Plus size={16} />}
        >
          Create Quotation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search quotations..."
          value={searchTerm}
          onChange={handleSearch}
          icon={<Search size={16} className="text-slate-400" />}
        />
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ]}
          value={statusFilter}
          onChange={handleStatusFilter}
        />
        <Select
          options={[
            { value: 'all', label: 'All Projects' },
            ...projects.map(project => ({
              value: project.id,
              label: project.name
            }))
          ]}
          value={projectFilter}
          onChange={handleProjectFilter}
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
                    Quotation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Amount
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
                {currentQuotations.length > 0 ? (
                  currentQuotations.map((quotation) => {
                    const project = projects.find(p => p.id === quotation.project_id);
                    const customer = project ? customers.find(c => c.id === project.customer_id) : null;
                    return (
                      <tr 
                        key={quotation.id} 
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">
                                #{quotation.id ? quotation.id.substring(0, 8).toUpperCase() : 'N/A'}
                              </div>
                              <div className="text-sm text-slate-500">
                                {customer?.name || 'Unknown Customer'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm text-slate-700 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/projects/${quotation.project_id}`)}
                          >
                            {project?.name || 'Unknown Project'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700">
                            {formatDate(quotation.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {formatCurrency(quotation.total, quotation.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(quotation.status)}>
                            {quotation.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleDropdown(quotation.id || '', e)}
                              icon={<MoreHorizontal size={16} />}
                            >
                              Actions
                            </Button>
                            
                            {activeDropdown === quotation.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 dropdown-menu">
                                <div className="py-1">
                                  <button
                                    onClick={() => navigate(`/quotations/${quotation.id}`)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <Eye size={16} className="mr-2" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <Edit size={16} className="mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => navigate(`/quotations/${quotation.id}/download`)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <Download size={16} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    onClick={() => handleDelete(quotation.id || '')}
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
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                        ? 'No quotations found matching your search criteria.'
                        : 'No quotations created yet. Create your first quotation!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {filteredQuotations.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-slate-700">
                <span className="mr-2">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotations.length)} of {filteredQuotations.length} results
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
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Quotation</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuotationToDelete(null);
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

export default QuotationList;