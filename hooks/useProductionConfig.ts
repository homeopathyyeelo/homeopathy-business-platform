
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { golangAPI } from "@/lib/api";
import { getDatabaseConfig, switchToPostgreSQL, switchToSupabase } from "@/lib/config/database-connection";
import { checkProductionHealth } from "@/lib/config/production-db";

interface ProductionConfig {
  environment: 'development' | 'production';
  databaseType: 'supabase' | 'postgresql';
  connected: boolean;
  loading: boolean;
  error: string | null;
  apiKeys: {
    whatsapp: string;
    sms: string;
    email: string;
    facebook: string;
    instagram: string;
  };
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gst: string;
  };
}

export const useProductionConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ProductionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_configuration')
          .select('key, value');

        if (error) throw error;

        const configMap = data?.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>) || {};

        // Get database configuration
        const dbConfig = await getDatabaseConfig();
        
        // Check connection status
        let connected = true;
        try {
          if (dbConfig.type === 'postgresql') {
            const health = await checkProductionHealth();
            connected = health.status === 'healthy';
          }
        } catch (error) {
          connected = false;
        }

        const productionConfig: ProductionConfig = {
          environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
          databaseType: dbConfig.type,
          connected,
          loading: false,
          error: null,
          apiKeys: {
            whatsapp: configMap['whatsapp_api_key'] || '',
            sms: configMap['kaleyra_api_key'] || '',
            email: configMap['email_api_key'] || '',
            facebook: configMap['facebook_access_token'] || '',
            instagram: configMap['instagram_access_token'] || ''
          },
          companyDetails: {
            name: configMap['company_name'] || 'YEELO HOMEOPATHY',
            address: configMap['company_address'] || '',
            phone: configMap['company_phone'] || '',
            email: configMap['company_email'] || '',
            gst: configMap['gst_number'] || ''
          }
        };

        setConfig(productionConfig);
      } catch (error: any) {
        console.error('Error fetching production config:', error);
        
        // Set error state
        setConfig({
          environment: 'development',
          databaseType: 'supabase',
          connected: false,
          loading: false,
          error: error.message || 'Failed to load configuration',
          apiKeys: {
            whatsapp: '',
            sms: '',
            email: '',
            facebook: '',
            instagram: ''
          },
          companyDetails: {
            name: 'YEELO HOMEOPATHY',
            address: '',
            phone: '',
            email: '',
            gst: ''
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const updateConfig = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('app_configuration')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) throw error;

      // Refresh config
      const { data } = await supabase
        .from('app_configuration')
        .select('key, value');

      if (data) {
        const configMap = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);

        setConfig(prev => prev ? {
          ...prev,
          apiKeys: {
            ...prev.apiKeys,
            whatsapp: configMap['whatsapp_api_key'] || '',
            sms: configMap['kaleyra_api_key'] || '',
            email: configMap['email_api_key'] || '',
            facebook: configMap['facebook_access_token'] || '',
            instagram: configMap['instagram_access_token'] || ''
          },
          companyDetails: {
            ...prev.companyDetails,
            name: configMap['company_name'] || prev.companyDetails.name,
            address: configMap['company_address'] || prev.companyDetails.address,
            phone: configMap['company_phone'] || prev.companyDetails.phone,
            email: configMap['company_email'] || prev.companyDetails.email,
            gst: configMap['gst_number'] || prev.companyDetails.gst
          }
        } : null);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  };

  return {
    config,
    loading,
    updateConfig
  };
};
