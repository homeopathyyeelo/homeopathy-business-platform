
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppTemplate, WhatsAppMessage } from "@/types";

export const useWhatsApp = () => {
  const { toast } = useToast();

  // Get all templates
  const getTemplates = async (): Promise<WhatsAppTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*');
      
      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch WhatsApp templates",
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  };

  // Get default template by type
  const getDefaultTemplate = async (type: string): Promise<WhatsAppTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('type', type)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching default template:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getDefaultTemplate:', error);
      return null;
    }
  };

  // Record a WhatsApp message in the database
  const recordMessage = async (
    phoneNumber: string,
    referenceId: string,
    message: string,
    type: string,
    status: string = 'sent'
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          phone_number: phoneNumber,
          reference_id: referenceId,
          message,
          type,
          status,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error recording WhatsApp message:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in recordMessage:', error);
      return null;
    }
  };

  // Replace template placeholders with actual values
  const formatTemplateContent = (
    template: string, 
    data: Record<string, string | number>
  ): string => {
    let content = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value));
    }
    
    return content;
  };

  // Send an invoice via WhatsApp
  const sendInvoice = async (
    phoneNumber: string,
    invoiceNumber: string,
    invoiceUrl: string,
    customerName: string,
    amount: number
  ): Promise<{success: boolean, message: string}> => {
    try {
      // Get the default invoice template
      const template = await getDefaultTemplate('invoice');
      
      if (!template) {
        return {
          success: false,
          message: "No default template found for invoices"
        };
      }
      
      // Format the message with actual values
      const message = formatTemplateContent(template.content, {
        customerName,
        invoiceNumber,
        amount: amount.toFixed(2)
      });
      
      // In a real implementation, we would use the WhatsApp Business API here
      // For demo purposes, we'll just log the message and record it
      console.log(`WhatsApp message to ${phoneNumber}:`, message);
      
      // Record the message in the database
      const messageId = await recordMessage(
        phoneNumber,
        invoiceNumber,
        message,
        'invoice'
      );
      
      if (!messageId) {
        return {
          success: true,
          message: "Invoice sent, but failed to record message history"
        };
      }
      
      return {
        success: true,
        message: "Invoice sent to customer's WhatsApp"
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        message: "Failed to send WhatsApp message"
      };
    }
  };

  return {
    getTemplates,
    getDefaultTemplate,
    recordMessage,
    formatTemplateContent,
    sendInvoice
  };
};

// Create a singleton instance for direct imports
export const WhatsApp = {
  sendInvoice: async (
    phoneNumber: string,
    invoiceNumber: string,
    invoiceUrl: string,
    customerName: string,
    amount: number
  ): Promise<{success: boolean, message: string}> => {
    const { sendInvoice } = useWhatsApp();
    return await sendInvoice(phoneNumber, invoiceNumber, invoiceUrl, customerName, amount);
  }
};
