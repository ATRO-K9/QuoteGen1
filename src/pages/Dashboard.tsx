import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FolderKanban, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { Customer, Project, Quotation } from '../types';
import { customerService, projectService, quotationService } from '../services/database.ts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<{
    totalCustomers: number;
    totalProjects: number;
    totalQuotations: number;
    totalAmount: number;
    monthlyAmountChange: number | null | typeof Infinity;
  }>({
    totalCustomers: 0,
    totalProjects: 0,
    totalQuotations: 0,
    totalAmount: 0,
    monthlyAmountChange: null
  });
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load data with proper async/await
        const [loadedCustomers, loadedProjects, loadedQuotations] = await Promise.all([
          customerService.getAll(),
          projectService.getAll(),
          quotationService.getAll()
        ]);
        
        setCustomers(loadedCustomers);
        setProjects(loadedProjects);
        setQuotations(loadedQuotations);
        
        // Calculate stats with the resolved data
        const totalAmount = loadedQuotations.reduce((sum, q) => sum + q.total, 0);

        // Calculate monthly change
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const currentMonthQuotations = loadedQuotations.filter(q => {
          const createdAt = new Date(q.created_at);
          return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
        });

        const prevMonthQuotations = loadedQuotations.filter(q => {
          const createdAt = new Date(q.created_at);
          return createdAt >= prevMonthStart && createdAt <= prevMonthEnd;
        });

        const currentMonthTotal = currentMonthQuotations.reduce((sum, q) => sum + q.total, 0);
        const prevMonthTotal = prevMonthQuotations.reduce((sum, q) => sum + q.total, 0);

        let monthlyAmountChange: number | null = null;
        if (prevMonthTotal > 0) {
          monthlyAmountChange = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
        } else if (currentMonthTotal > 0) {
           monthlyAmountChange = Infinity; // Indicate new data in current month
        } else {
           monthlyAmountChange = 0; // No data in either month
        }
        
        setStats({
          totalCustomers: loadedCustomers.length,
          totalProjects: loadedProjects.length,
          totalQuotations: loadedQuotations.length,
          totalAmount,
          monthlyAmountChange
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // You might want to show an error message to the user here
      }
    };

    loadDashboardData();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-500';
      case 'in-progress': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'draft': return 'text-slate-500';
      case 'sent': return 'text-blue-500';
      case 'accepted': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };
  
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
    
  const recentQuotations = quotations
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Customers</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCustomers}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/customers')}
                className="text-blue-600 hover:text-blue-700 px-3 py-1"
              >
                View all customers
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Projects</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalProjects}</h3>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/projects')}
                className="text-teal-600 hover:text-teal-700 px-3 py-1"
              >
                View all projects
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Quotations</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalQuotations}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/quotations')}
                className="text-purple-600 hover:text-purple-700 px-3 py-1"
              >
                View all quotations
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Amount</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalAmount)}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              {stats.monthlyAmountChange !== null ? (
                <div className={`flex items-center text-sm ${stats.monthlyAmountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.monthlyAmountChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span>
                    {stats.monthlyAmountChange === Infinity
                      ? 'New data this month'
                      : stats.monthlyAmountChange === 0 && stats.totalAmount === 0
                        ? 'No data'
                        : `${typeof stats.monthlyAmountChange === 'number' ? stats.monthlyAmountChange.toFixed(1) : '-'}% ${stats.monthlyAmountChange !== null && stats.monthlyAmountChange >= 0 ? 'from last month' : 'from last month'}`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-sm text-slate-500">
                   Loading...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
              <Users className="h-10 w-10" />
              <h3 className="text-xl font-semibold">Add New Customer</h3>
              <p className="text-blue-100">Create a new customer to start generating quotations</p>
              <Button 
                className="mt-2 bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => navigate('/customers/new')}
              >
                Add Customer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
              <FolderKanban className="h-10 w-10" />
              <h3 className="text-xl font-semibold">Create New Project</h3>
              <p className="text-teal-100">Set up a new project for an existing customer</p>
              <Button 
                className="mt-2 bg-white text-teal-700 hover:bg-teal-50"
                onClick={() => navigate('/projects/new')}
              >
                Add Project
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
              <FileText className="h-10 w-10" />
              <h3 className="text-xl font-semibold">Generate Quotation</h3>
              <p className="text-purple-100">Create a new quotation for an existing project</p>
              <Button 
                className="mt-2 bg-white text-purple-700 hover:bg-purple-50"
                onClick={() => navigate('/quotations/new')}
              >
                Create Quotation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent projects and quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/projects')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentProjects.length > 0 ? (
                recentProjects.map(project => {
                  const customer = customers.find(c => c.id === project.customer_id);
                  return (
                    <div 
                      key={project.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{project.name}</h4>
                          <p className="text-xs text-slate-500">{customer?.name || 'Unknown Customer'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p>No projects yet. Create your first project!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent quotations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Quotations</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/quotations')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentQuotations.length > 0 ? (
                recentQuotations.map(quotation => {
                  const customer = customers.find(c => c.id === quotation.customer_id);
                  const project = projects.find(p => p.id === quotation.project_id);
                  return (
                    <div 
                      key={quotation.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/quotations/${quotation.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {project?.name || 'Unknown Project'}
                          </h4>
                          <p className="text-xs text-slate-500">{customer?.name || 'Unknown Customer'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(quotation.total)}</span>
                        <span className={`text-xs font-medium capitalize ${getStatusColor(quotation.status)}`}>
                          {quotation.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p>No quotations yet. Generate your first quotation!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;