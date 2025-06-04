import { supabase } from '../lib/supabase';
import { Customer, Project, ServiceItem, Quotation, CompanySettings } from '../types';

// Customer services
export const customerService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Customer[];
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Customer;
  },
  
  create: async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
      
    if (error) throw error;
    return data as Customer;
  },
  
  update: async (id: string, customer: Partial<Customer>) => {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Customer;
  },
  
  delete: async (id: string) => {
    try {
      console.log('Starting customer delete process for ID:', id);
      
      // First, get all projects for this customer
      console.log('Fetching projects for customer...');
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('customer_id', id);
        
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }
      
      console.log('Found projects:', projects);
      
      if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        console.log('Project IDs to delete:', projectIds);
        
        // Delete service items for these projects
        console.log('Deleting service items...');
        const { error: serviceItemsError } = await supabase
          .from('service_items')
          .delete()
          .in('project_id', projectIds);
          
        if (serviceItemsError) {
          console.error('Error deleting service items:', serviceItemsError);
          throw serviceItemsError;
        }
        console.log('Service items deleted successfully');
        
        // Delete quotations for these projects
        console.log('Deleting quotations...');
        const { error: quotationsError } = await supabase
          .from('quotations')
          .delete()
          .in('project_id', projectIds);
          
        if (quotationsError) {
          console.error('Error deleting quotations:', quotationsError);
          throw quotationsError;
        }
        console.log('Quotations deleted successfully');
        
        // Delete the projects
        console.log('Deleting projects...');
        const { error: projectsDeleteError } = await supabase
          .from('projects')
          .delete()
          .in('id', projectIds);
          
        if (projectsDeleteError) {
          console.error('Error deleting projects:', projectsDeleteError);
          throw projectsDeleteError;
        }
        console.log('Projects deleted successfully');
      } else {
        console.log('No projects found for this customer');
      }
      
      // Finally, delete the customer
      console.log('Deleting customer...');
      const { data: deleteData, error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .select();
        
      if (customerError) {
        console.error('Error deleting customer:', customerError);
        throw customerError;
      }
      
      if (!deleteData || deleteData.length === 0) {
        console.error('No customer was deleted');
        throw new Error('No customer was deleted');
      }
      
      console.log('Customer deleted successfully:', deleteData);
      return true;
    } catch (error) {
      console.error('Error in delete operation:', error);
      throw error;
    }
  }
};

// Project services
export const projectService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Project[];
  },
  
  getByCustomerId: async (customerId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Project[];
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Project;
  },
  
  create: async (project: Omit<Project, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
      
    if (error) throw error;
    return data as Project;
  },
  
  update: async (id: string, project: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Project;
  },
  
  delete: async (id: string) => {
    try {
      console.log('Starting project delete process for ID:', id);
      
      // Delete service items for this project
      console.log('Deleting service items...');
      const { error: serviceItemsError } = await supabase
        .from('service_items')
        .delete()
        .eq('project_id', id);
        
      if (serviceItemsError) {
        console.error('Error deleting service items:', serviceItemsError);
        throw serviceItemsError;
      }
      console.log('Service items deleted successfully');
      
      // Delete quotations for this project
      console.log('Deleting quotations...');
      const { error: quotationsError } = await supabase
        .from('quotations')
        .delete()
        .eq('project_id', id);
        
      if (quotationsError) {
        console.error('Error deleting quotations:', quotationsError);
        throw quotationsError;
      }
      console.log('Quotations deleted successfully');
      
      // Delete the project
      console.log('Deleting project...');
      const { data: deleteData, error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .select();
        
      if (projectError) {
        console.error('Error deleting project:', projectError);
        throw projectError;
      }
      
      if (!deleteData || deleteData.length === 0) {
        console.error('No project was deleted');
        throw new Error('No project was deleted');
      }
      
      console.log('Project deleted successfully:', deleteData);
      return true;
    } catch (error) {
      console.error('Error in delete operation:', error);
      throw error;
    }
  }
};

// Service Item services
export const serviceItemService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as ServiceItem[];
  },
  
  getByProjectId: async (projectId: string) => {
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as ServiceItem[];
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as ServiceItem;
  },
  
  create: async (item: Omit<ServiceItem, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('service_items')
      .insert([item])
      .select()
      .single();
      
    if (error) throw error;
    return data as ServiceItem;
  },
  
  update: async (id: string, item: Partial<ServiceItem>) => {
    const { data, error } = await supabase
      .from('service_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as ServiceItem;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('service_items')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};

// Quotation services
export const quotationService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          service_item_id,
          quantity,
          price
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform quotation_items into the expected format
    const quotations = data.map(quotation => ({
      ...quotation,
      items: quotation.quotation_items.map((item: any) => ({
        id: item.service_item_id,
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    return quotations as Quotation[];
  },
  
  getByProjectId: async (projectId: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          service_item_id,
          quantity,
          price
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const quotations = data.map(quotation => ({
      ...quotation,
      items: quotation.quotation_items.map((item: any) => ({
        id: item.service_item_id,
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    return quotations as Quotation[];
  },
  
  getByCustomerId: async (customerId: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          service_item_id,
          quantity,
          price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const quotations = data.map(quotation => ({
      ...quotation,
      items: quotation.quotation_items.map((item: any) => ({
        id: item.service_item_id,
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    return quotations as Quotation[];
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          service_item_id,
          quantity,
          price,
          service_items ( name, description )
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Flatten the nested service_items data and map to the expected ServiceItem structure
    return {
      ...data,
      items: data.quotation_items.map((item: any) => ({
        id: item.service_item_id,
        quantity: item.quantity,
        price: item.price,
        name: item.service_items.name,
        description: item.service_items.description
      }))
    } as Quotation;
  },
  
  create: async (quotation: Omit<Quotation, 'id' | 'created_at'>) => {
    // Start a transaction
    const { data: newQuotation, error: quotationError } = await supabase
      .from('quotations')
      .insert([{
        project_id: quotation.project_id,
        customer_id: quotation.customer_id,
        date: quotation.date,
        valid_until: quotation.valid_until,
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        total: quotation.total,
        notes: quotation.notes,
        terms: quotation.terms,
        status: quotation.status,
        currency: quotation.currency
      }])
      .select()
      .single();
      
    if (quotationError) throw quotationError;
    
    // Insert quotation items
    const quotationItems = quotation.items.map(item => ({
      quotation_id: newQuotation.id,
      service_item_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));
    
    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(quotationItems);
      
    if (itemsError) throw itemsError;
    
    return {
      ...newQuotation,
      items: quotation.items
    } as Quotation;
  },
  
  update: async (id: string, quotation: Partial<Quotation>) => {
    // Update quotation
    const { data: updatedQuotation, error: quotationError } = await supabase
      .from('quotations')
      .update({
        project_id: quotation.project_id,
        customer_id: quotation.customer_id,
        date: quotation.date,
        valid_until: quotation.valid_until,
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        total: quotation.total,
        notes: quotation.notes,
        terms: quotation.terms,
        status: quotation.status,
        currency: quotation.currency
      })
      .eq('id', id)
      .select()
      .single();
      
    if (quotationError) throw quotationError;
    
    // If items are provided, update them
    if (quotation.items) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('quotation_items')
        .delete()
        .eq('quotation_id', id);
        
      if (deleteError) throw deleteError;
      
      // Insert new items
      const quotationItems = quotation.items.map(item => ({
        quotation_id: id,
        service_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItems);
        
      if (itemsError) throw itemsError;
    }
    
    return {
      ...updatedQuotation,
      items: quotation.items || []
    } as Quotation;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};

// Company Settings services
export const companySettingsService = {
  getCompanySettings: async () => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 'company-settings') // Assuming a single row with a fixed ID
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // No row found
        return null; // Return null if settings don't exist yet
      }
      throw error;
    }
    return data as CompanySettings;
  },
  
  saveCompanySettings: async (settings: CompanySettings) => {
    try {
      // Ensure the settings object has the fixed ID for upsert
      const settingsToSave = {
        ...settings,
        id: 'company-settings',
      };

      const { data, error } = await supabase
        .from('company_settings')
        .upsert([settingsToSave]) // Upsert using the settings object with the fixed ID
        .select()
        .single();

      if (error) {
        console.error('Error saving company settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in save company settings:', error);
      return null;
    }
  },

  async uploadLogo(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in upload logo:', error);
      return null;
    }
  }
};