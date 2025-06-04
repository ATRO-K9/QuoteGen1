import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { quotationService, customerService, projectService } from '../../services/database';

const QuotationDownload: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    if (id) {
      const quotation = quotationService.getById(id);
      if (!quotation) {
        navigate('/quotations');
      }
    }
  }, [id, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(`/quotations/${id}`)}
        />
        <h2 className="text-2xl font-bold text-slate-900">Print Quotation</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mb-6">
          <Printer className="h-12 w-12 text-purple-600" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Ready to print your quotation
        </h3>
        
        <p className="text-slate-600 mb-6 text-center max-w-md">
          Click the button below to open the print dialog and save your quotation as PDF or print it directly.
        </p>
        
        <Button
          icon={<Printer size={16} />}
          onClick={() => {
            if (id) {
              window.print();
            }
          }}
        >
          Print Quotation
        </Button>
        
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/quotations/${id}`)}
          >
            Return to Quotation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuotationDownload;