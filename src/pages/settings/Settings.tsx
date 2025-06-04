import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/TextArea';
import { companySettingsService } from '../../services/companySettingsService';
import { CompanySettings } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Upload, X, Loader2 } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({
    id: 'company-settings',
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await companySettingsService.get();
      if (data) {
        console.log('Loaded settings data:', data);
        setSettings(data);
        setLogoPreview(data.logo_url);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let logoUrl = settings.logo_url;

      if (logoFile) {
        setUploadingLogo(true);
        const uploadedUrl = await companySettingsService.uploadLogo(logoFile);
        setUploadingLogo(false);

        if (uploadedUrl) {
          logoUrl = uploadedUrl;
          setLogoFile(null);
        } else {
          console.error('Logo upload failed');
          toast.error('Failed to upload logo');
          setSaving(false);
          return;
        }
      }

      console.log('Attempting to save settings:', { ...settings, logo_url: logoUrl });
      const updatedSettings = await companySettingsService.save({
        ...settings,
        logo_url: logoUrl
      });
      console.log('Result of companySettingsService.save:', updatedSettings);

      if (updatedSettings) {
        console.log('Saved settings with new logo_url:', updatedSettings.logo_url);
        setSettings(updatedSettings);
        setLogoPreview(updatedSettings.logo_url);
        toast.success('Company settings saved successfully');
      } else {
        console.error('companySettingsService.save returned null');
        toast.error('Failed to save company settings: Service returned null');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save company settings: An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Logo preview URL generated:', reader.result);
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    setSaving(true);
    try {
      const updatedSettings = await companySettingsService.save({
        ...settings,
        logo_url: null,
      });
      if (updatedSettings) {
        setSettings(updatedSettings);
        setLogoPreview(null);
        setLogoFile(null);
        toast.success('Company logo removed');
      } else {
        toast.error('Failed to remove company logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove company logo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="logo">Company Logo</Label>
                
                <div 
                  className={
                    cn(
                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors",
                      uploadingLogo && "opacity-60 cursor-progress",
                      (logoPreview || settings.logo_url) && "hidden"
                    )
                  }
                  onClick={() => !uploadingLogo && document.getElementById('logo-upload-input')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!uploadingLogo && e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                >
                  {uploadingLogo ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                      <Upload className="w-8 h-8 mb-3" />
                      <p className="mb-2 text-sm text-center">Drag 'n' drop logo here, or click to select file</p>
                      <p className="text-xs">(SVG, PNG, JPG, GIF)</p>
                    </div>
                  )}
                  <Input
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>

                {(logoPreview || settings.logo_url) && !uploadingLogo && (
                  <div className="mt-2 relative w-32 h-32 border rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-1">
                    <div 
                      className="absolute inset-0 grid grid-cols-8 gap-px p-px opacity-50"
                      style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px 8px, 8px 0' }}
                    ></div>
                    <img
                      src={logoPreview || settings.logo_url || ''}
                      alt="Company logo preview"
                      className="relative z-10 max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        setLogoPreview(null);
                        setSettings(prev => ({ ...prev, logo_url: null }));
                        toast.error('Failed to load company logo image.');
                      }}
                    />
                    {!saving && (
                       <Button
                         type="button"
                         variant="danger"
                         size="sm"
                         className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-20 flex items-center justify-center p-0 leading-none"
                         onClick={handleRemoveLogo}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={saving || uploadingLogo}>
              {saving ? 'Saving...' : uploadingLogo ? 'Uploading Logo...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 