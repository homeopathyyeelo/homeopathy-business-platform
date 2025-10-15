export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_configuration: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_number: string
          created_at: string | null
          customer_id: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          staff_id: string | null
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_number: string
          created_at?: string | null
          customer_id: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          staff_id?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_number?: string
          created_at?: string | null
          customer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          staff_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          read_count: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          read_count?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          read_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          read_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "marketing_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string | null
          credit_note_number: string
          customer_id: string | null
          date: string
          id: string
          notes: string | null
          original_invoice_id: string | null
          return_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_note_number: string
          customer_id?: string | null
          date: string
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          return_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_note_number?: string
          customer_id?: string | null
          date?: string
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          return_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_discount_history: {
        Row: {
          applied_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          invoice_id: string | null
          notes: string | null
        }
        Insert: {
          applied_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount: number
          discount_type: string
          discount_value: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
        }
        Update: {
          applied_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_discount_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_discount_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean | null
          address: string | null
          balance_type: string | null
          balanceType: string | null
          city: string | null
          created_at: string | null
          credit_days: number | null
          credit_limit: number | null
          creditLimit: number | null
          customer_id: string
          default_discount_percentage: number | null
          discount_type: string | null
          email: string | null
          first_name: string
          firstName: string | null
          gst_number: string | null
          gstNumber: string | null
          id: string
          is_active: boolean | null
          isActive: boolean | null
          last_name: string | null
          lastName: string | null
          loyalty_points: number | null
          max_credit_limit: number | null
          name: string | null
          opening_balance: number | null
          openingBalance: number | null
          outstandingBalance: number | null
          phone: string
          pincode: string | null
          priceLevel: string | null
          state: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          balance_type?: string | null
          balanceType?: string | null
          city?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          creditLimit?: number | null
          customer_id: string
          default_discount_percentage?: number | null
          discount_type?: string | null
          email?: string | null
          first_name: string
          firstName?: string | null
          gst_number?: string | null
          gstNumber?: string | null
          id?: string
          is_active?: boolean | null
          isActive?: boolean | null
          last_name?: string | null
          lastName?: string | null
          loyalty_points?: number | null
          max_credit_limit?: number | null
          name?: string | null
          opening_balance?: number | null
          openingBalance?: number | null
          outstandingBalance?: number | null
          phone: string
          pincode?: string | null
          priceLevel?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          balance_type?: string | null
          balanceType?: string | null
          city?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          creditLimit?: number | null
          customer_id?: string
          default_discount_percentage?: number | null
          discount_type?: string | null
          email?: string | null
          first_name?: string
          firstName?: string | null
          gst_number?: string | null
          gstNumber?: string | null
          id?: string
          is_active?: boolean | null
          isActive?: boolean | null
          last_name?: string | null
          lastName?: string | null
          loyalty_points?: number | null
          max_credit_limit?: number | null
          name?: string | null
          opening_balance?: number | null
          openingBalance?: number | null
          outstandingBalance?: number | null
          phone?: string
          pincode?: string | null
          priceLevel?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          actual_delivery_time: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          customer_address: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          delivery_date: string | null
          delivery_status: string
          estimated_delivery_time: string | null
          id: string
          notes: string | null
          order_id: string
          order_type: string
          payment_amount: number | null
          payment_collected: boolean | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_time?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_status?: string
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_id: string
          order_type: string
          payment_amount?: number | null
          payment_collected?: boolean | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_time?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_status?: string
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          order_type?: string
          payment_amount?: number | null
          payment_collected?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_staff: {
        Row: {
          completed_deliveries: number | null
          created_at: string | null
          current_status: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          completed_deliveries?: number | null
          created_at?: string | null
          current_status?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_deliveries?: number | null
          created_at?: string | null
          current_status?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          delivery_id: string
          id: string
          location: string | null
          notes: string | null
          status: string
          timestamp: string | null
          updated_by: string | null
        }
        Insert: {
          delivery_id: string
          id?: string
          location?: string | null
          notes?: string | null
          status: string
          timestamp?: string | null
          updated_by?: string | null
        }
        Update: {
          delivery_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          timestamp?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          areas: string[] | null
          cities: string[] | null
          created_at: string | null
          delivery_charge: number
          estimated_delivery_time_in_hours: number
          id: string
          is_active: boolean | null
          min_order_value_for_free_delivery: number | null
          name: string
          pincodes: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas?: string[] | null
          cities?: string[] | null
          created_at?: string | null
          delivery_charge: number
          estimated_delivery_time_in_hours: number
          id?: string
          is_active?: boolean | null
          min_order_value_for_free_delivery?: number | null
          name: string
          pincodes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas?: string[] | null
          cities?: string[] | null
          created_at?: string | null
          delivery_charge?: number
          estimated_delivery_time_in_hours?: number
          id?: string
          is_active?: boolean | null
          min_order_value_for_free_delivery?: number | null
          name?: string
          pincodes?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_communications: {
        Row: {
          content: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_communications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      environment_variables: {
        Row: {
          created_at: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          expense_category_id: string | null
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          payment_method: string | null
          reference_number: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          expense_category_id?: string | null
          expense_date: string
          expense_number: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          expense_category_id?: string | null
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_configuration: {
        Row: {
          api_credentials: Json | null
          auto_einvoice_threshold: number | null
          auto_eway_bill_threshold: number | null
          auto_filing_enabled: boolean | null
          business_name: string
          created_at: string | null
          gst_number: string
          id: string
          updated_at: string | null
        }
        Insert: {
          api_credentials?: Json | null
          auto_einvoice_threshold?: number | null
          auto_eway_bill_threshold?: number | null
          auto_filing_enabled?: boolean | null
          business_name: string
          created_at?: string | null
          gst_number: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          api_credentials?: Json | null
          auto_einvoice_threshold?: number | null
          auto_eway_bill_threshold?: number | null
          auto_filing_enabled?: boolean | null
          business_name?: string
          created_at?: string | null
          gst_number?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gst_returns: {
        Row: {
          created_at: string | null
          created_by: string | null
          gstr1: Json | null
          gstr2: Json | null
          gstr3b: Json | null
          id: string
          notes: string | null
          period: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          gstr1?: Json | null
          gstr2?: Json | null
          gstr3b?: Json | null
          id?: string
          notes?: string | null
          period: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          gstr1?: Json | null
          gstr2?: Json | null
          gstr3b?: Json | null
          id?: string
          notes?: string | null
          period?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string | null
          discount: number | null
          expiry_date: string | null
          id: string
          last_stock_update: string | null
          manufacturing_date: string | null
          mrp: number | null
          product_id: string
          purchase_price: number | null
          quantity_in_stock: number
          rack_location: string | null
          selling_price_retail: number | null
          selling_price_wholesale: number | null
          updated_at: string | null
          warehouse_id: string
          warehouse_name: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          last_stock_update?: string | null
          manufacturing_date?: string | null
          mrp?: number | null
          product_id: string
          purchase_price?: number | null
          quantity_in_stock?: number
          rack_location?: string | null
          selling_price_retail?: number | null
          selling_price_wholesale?: number | null
          updated_at?: string | null
          warehouse_id: string
          warehouse_name?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          last_stock_update?: string | null
          manufacturing_date?: string | null
          mrp?: number | null
          product_id?: string
          purchase_price?: number | null
          quantity_in_stock?: number
          rack_location?: string | null
          selling_price_retail?: number | null
          selling_price_wholesale?: number | null
          updated_at?: string | null
          warehouse_id?: string
          warehouse_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          service_id: string | null
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity: number
          service_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          e_invoice_date: string | null
          e_invoice_number: string | null
          e_way_bill_date: string | null
          e_way_bill_number: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          shipping_charges: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          terms_conditions: string | null
          total: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          e_invoice_date?: string | null
          e_invoice_number?: string | null
          e_way_bill_date?: string | null
          e_way_bill_number?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_charges?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          e_invoice_date?: string | null
          e_invoice_number?: string | null
          e_way_bill_date?: string | null
          e_way_bill_number?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_charges?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          balance: number
          created_at: string | null
          created_by: string | null
          credit: number
          date: string
          debit: number
          description: string | null
          document_number: string
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          notes: string | null
          payment_method: string | null
          related_id: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          created_by?: string | null
          credit?: number
          date: string
          debit?: number
          description?: string | null
          document_number: string
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_id?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          created_by?: string | null
          credit?: number
          date?: string
          debit?: number
          description?: string | null
          document_number?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_id?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          message_content: string
          name: string
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content: string
          name: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content?: string
          name?: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_contacts: {
        Row: {
          area: string | null
          category: string | null
          city: string | null
          contact_type: string | null
          created_at: string | null
          customer_id: string | null
          email: string | null
          first_name: string | null
          id: string
          is_doctor: boolean | null
          is_existing_customer: boolean | null
          is_subscribed: boolean | null
          last_name: string | null
          phone_number: string
          society: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          category?: string | null
          city?: string | null
          contact_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_doctor?: boolean | null
          is_existing_customer?: boolean | null
          is_subscribed?: boolean | null
          last_name?: string | null
          phone_number: string
          society?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          category?: string | null
          city?: string | null
          contact_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_doctor?: boolean | null
          is_existing_customer?: boolean | null
          is_subscribed?: boolean | null
          last_name?: string | null
          phone_number?: string
          society?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_segments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          invoice_id: string
          message: string | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          sent_via: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          invoice_id: string
          message?: string | null
          reminder_date: string
          reminder_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string
          message?: string | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          date: string
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          related_invoice: string | null
          related_purchase: string | null
          status: string
          transaction_number: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          date: string
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          related_invoice?: string | null
          related_purchase?: string | null
          status?: string
          transaction_number: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          related_invoice?: string | null
          related_purchase?: string | null
          status?: string
          transaction_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_related_invoice_fkey"
            columns: ["related_invoice"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_related_purchase_fkey"
            columns: ["related_purchase"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration: string
          id: string
          instructions: string | null
          prescription_id: string
          product_id: string
          product_name: string | null
          quantity: number
          refills_allowed: number
          refills_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration: string
          id?: string
          instructions?: string | null
          prescription_id: string
          product_id: string
          product_name?: string | null
          quantity: number
          refills_allowed?: number
          refills_used?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string
          id?: string
          instructions?: string | null
          prescription_id?: string
          product_id?: string
          product_name?: string | null
          quantity?: number
          refills_allowed?: number
          refills_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_reminders: {
        Row: {
          created_at: string
          id: string
          message: string | null
          patient_id: string
          prescription_id: string
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          sent_via: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          patient_id: string
          prescription_id: string
          reminder_date: string
          reminder_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          patient_id?: string
          prescription_id?: string
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_reminders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_name: string
          expiry_date: string | null
          id: string
          is_recurring: boolean
          next_refill_date: string | null
          notes: string | null
          patient_id: string
          prescription_date: string
          refill_period_days: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_name: string
          expiry_date?: string | null
          id?: string
          is_recurring?: boolean
          next_refill_date?: string | null
          notes?: string | null
          patient_id: string
          prescription_date?: string
          refill_period_days?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_name?: string
          expiry_date?: string | null
          id?: string
          is_recurring?: boolean
          next_refill_date?: string | null
          notes?: string | null
          patient_id?: string
          prescription_date?: string
          refill_period_days?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          change_reason: string
          created_at: string
          created_by: string | null
          id: string
          new_mrp: number | null
          new_purchase_price: number | null
          new_retail_price: number | null
          new_wholesale_price: number | null
          old_mrp: number | null
          old_purchase_price: number | null
          old_retail_price: number | null
          old_wholesale_price: number | null
          product_id: string
          purchase_id: string | null
        }
        Insert: {
          change_reason: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_mrp?: number | null
          new_purchase_price?: number | null
          new_retail_price?: number | null
          new_wholesale_price?: number | null
          old_mrp?: number | null
          old_purchase_price?: number | null
          old_retail_price?: number | null
          old_wholesale_price?: number | null
          product_id: string
          purchase_id?: string | null
        }
        Update: {
          change_reason?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_mrp?: number | null
          new_purchase_price?: number | null
          new_retail_price?: number | null
          new_wholesale_price?: number | null
          old_mrp?: number | null
          old_purchase_price?: number | null
          old_retail_price?: number | null
          old_wholesale_price?: number | null
          product_id?: string
          purchase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_price_history_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_mappings: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          auto_price_update: boolean | null
          barcode: string | null
          batch_tracking: boolean | null
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          default_rack_location: string | null
          default_selling_price_retail: number | null
          default_selling_price_wholesale: number | null
          description: string | null
          expiry_tracking: boolean | null
          form: string | null
          full_medicine_name: string | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          is_batch_tracked: boolean | null
          is_expiry_tracked: boolean | null
          is_returnable: boolean | null
          last_purchase_date: string | null
          last_purchase_price: number | null
          manufacturer: string | null
          margin_percentage: number | null
          max_stock_level: number | null
          medicine_form: string | null
          min_stock_level: number | null
          mrp: number | null
          name: string
          pack_size: string | null
          potency: string | null
          potency_notation: string | null
          potency_scale: string | null
          potency_value: string | null
          product_code: string
          purchase_price: number | null
          purchase_unit_id: string | null
          reorder_level: number | null
          retail_price: number | null
          sale_unit_id: string | null
          sku: string | null
          tax_rate_id: string | null
          updated_at: string | null
          wholesale_price: number | null
        }
        Insert: {
          auto_price_update?: boolean | null
          barcode?: string | null
          batch_tracking?: boolean | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          default_rack_location?: string | null
          default_selling_price_retail?: number | null
          default_selling_price_wholesale?: number | null
          description?: string | null
          expiry_tracking?: boolean | null
          form?: string | null
          full_medicine_name?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          is_batch_tracked?: boolean | null
          is_expiry_tracked?: boolean | null
          is_returnable?: boolean | null
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          manufacturer?: string | null
          margin_percentage?: number | null
          max_stock_level?: number | null
          medicine_form?: string | null
          min_stock_level?: number | null
          mrp?: number | null
          name: string
          pack_size?: string | null
          potency?: string | null
          potency_notation?: string | null
          potency_scale?: string | null
          potency_value?: string | null
          product_code: string
          purchase_price?: number | null
          purchase_unit_id?: string | null
          reorder_level?: number | null
          retail_price?: number | null
          sale_unit_id?: string | null
          sku?: string | null
          tax_rate_id?: string | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Update: {
          auto_price_update?: boolean | null
          barcode?: string | null
          batch_tracking?: boolean | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          default_rack_location?: string | null
          default_selling_price_retail?: number | null
          default_selling_price_wholesale?: number | null
          description?: string | null
          expiry_tracking?: boolean | null
          form?: string | null
          full_medicine_name?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          is_batch_tracked?: boolean | null
          is_expiry_tracked?: boolean | null
          is_returnable?: boolean | null
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          manufacturer?: string | null
          margin_percentage?: number | null
          max_stock_level?: number | null
          medicine_form?: string | null
          min_stock_level?: number | null
          mrp?: number | null
          name?: string
          pack_size?: string | null
          potency?: string | null
          potency_notation?: string | null
          potency_scale?: string | null
          potency_value?: string | null
          product_code?: string
          purchase_price?: number | null
          purchase_unit_id?: string | null
          reorder_level?: number | null
          retail_price?: number | null
          sale_unit_id?: string | null
          sku?: string | null
          tax_rate_id?: string | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_purchase_unit_id_fkey"
            columns: ["purchase_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sale_unit_id_fkey"
            columns: ["sale_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          applicable_discounts: Json | null
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_breakdown: Json | null
          discount_percentage: number | null
          discounted_rate: number | null
          id: string
          margin_percentage: number | null
          original_rate: number | null
          product_id: string
          purchase_id: string
          quantity: number
          received_quantity: number | null
          suggested_retail_price: number | null
          suggested_wholesale_price: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          applicable_discounts?: Json | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_breakdown?: Json | null
          discount_percentage?: number | null
          discounted_rate?: number | null
          id?: string
          margin_percentage?: number | null
          original_rate?: number | null
          product_id: string
          purchase_id: string
          quantity: number
          received_quantity?: number | null
          suggested_retail_price?: number | null
          suggested_wholesale_price?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          applicable_discounts?: Json | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_breakdown?: Json | null
          discount_percentage?: number | null
          discounted_rate?: number | null
          id?: string
          margin_percentage?: number | null
          original_rate?: number | null
          product_id?: string
          purchase_id?: string
          quantity?: number
          received_quantity?: number | null
          suggested_retail_price?: number | null
          suggested_wholesale_price?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number | null
          terms_conditions: string | null
          total: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          po_number: string
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          brand_discount_amount: number | null
          category_discount_amount: number | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          effective_total: number | null
          id: string
          notes: string | null
          payment_discount_amount: number | null
          payment_method: string | null
          payment_status: string | null
          purchase_date: string
          purchase_number: string
          shipping_charges: number | null
          status: string
          subtotal: number
          supplier_discount_amount: number | null
          supplier_id: string
          tax_amount: number | null
          terms_conditions: string | null
          total: number
          total_discount_applied: number | null
          updated_at: string | null
          volume_discount_amount: number | null
          warehouse_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          brand_discount_amount?: number | null
          category_discount_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          effective_total?: number | null
          id?: string
          notes?: string | null
          payment_discount_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date: string
          purchase_number: string
          shipping_charges?: number | null
          status?: string
          subtotal?: number
          supplier_discount_amount?: number | null
          supplier_id: string
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          total_discount_applied?: number | null
          updated_at?: string | null
          volume_discount_amount?: number | null
          warehouse_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          brand_discount_amount?: number | null
          category_discount_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          effective_total?: number | null
          id?: string
          notes?: string | null
          payment_discount_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number?: string
          shipping_charges?: number | null
          status?: string
          subtotal?: number
          supplier_discount_amount?: number | null
          supplier_id?: string
          tax_amount?: number | null
          terms_conditions?: string | null
          total?: number
          total_discount_applied?: number | null
          updated_at?: string | null
          volume_discount_amount?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          parameters: Json | null
          report_data: Json
          report_name: string
          report_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters?: Json | null
          report_data: Json
          report_name: string
          report_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters?: Json | null
          report_data?: Json
          report_name?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          items: Json | null
          notes: string | null
          original_invoice_id: string | null
          original_invoice_number: string | null
          reason: string | null
          refund_method: string | null
          return_date: string
          return_number: string
          status: string | null
          total_return_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string | null
          reason?: string | null
          refund_method?: string | null
          return_date: string
          return_number: string
          status?: string | null
          total_return_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string | null
          reason?: string | null
          refund_method?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          total_return_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      segment_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          segment_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          segment_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "marketing_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_contacts_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          service_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          service_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          service_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          service_code: string
          tax_rate_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          service_code: string
          tax_rate_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          service_code?: string
          tax_rate_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          id: string
          ifsc_code: string | null
          joining_date: string | null
          pan_number: string | null
          salary: number | null
          staff_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          ifsc_code?: string | null
          joining_date?: string | null
          pan_number?: string | null
          salary?: number | null
          staff_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          ifsc_code?: string | null
          joining_date?: string | null
          pan_number?: string | null
          salary?: number | null
          staff_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          created_at: string | null
          created_by: string | null
          date: string
          expiry_date: string | null
          id: string
          movement_number: string
          notes: string | null
          product_id: string
          quantity_in: number | null
          quantity_out: number | null
          reference_id: string | null
          reference_number: string | null
          type: string
          warehouse_id: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          expiry_date?: string | null
          id?: string
          movement_number: string
          notes?: string | null
          product_id: string
          quantity_in?: number | null
          quantity_out?: number | null
          reference_id?: string | null
          reference_number?: string | null
          type: string
          warehouse_id?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          expiry_date?: string | null
          id?: string
          movement_number?: string
          notes?: string | null
          product_id?: string
          quantity_in?: number | null
          quantity_out?: number | null
          reference_id?: string | null
          reference_number?: string | null
          type?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_discounts: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          discount_amount: number | null
          discount_percentage: number
          discount_type: string
          id: string
          is_active: boolean
          min_amount: number | null
          min_quantity: number | null
          notes: string | null
          payment_terms_days: number | null
          supplier_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number
          discount_type: string
          id?: string
          is_active?: boolean
          min_amount?: number | null
          min_quantity?: number | null
          notes?: string | null
          payment_terms_days?: number | null
          supplier_id: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number
          discount_type?: string
          id?: string
          is_active?: boolean
          min_amount?: number | null
          min_quantity?: number | null
          notes?: string | null
          payment_terms_days?: number | null
          supplier_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_discounts_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_discounts_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_discounts_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance_type: string | null
          bank_account: string | null
          bank_name: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string | null
          email: string | null
          gst_number: string | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          opening_balance: number | null
          phone: string | null
          pincode: string | null
          state: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          balance_type?: string | null
          bank_account?: string | null
          bank_name?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          opening_balance?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          balance_type?: string | null
          bank_account?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          opening_balance?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_composite: boolean | null
          name: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_composite?: boolean | null
          name: string
          rate: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_composite?: boolean | null
          name?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      taxes: {
        Row: {
          created_at: string | null
          description: string | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          name: string
          percentage: number
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          percentage: number
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          percentage?: number
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          base_unit_id: string | null
          conversion_factor: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          short_name: string
          updated_at: string | null
        }
        Insert: {
          base_unit_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          short_name: string
          updated_at?: string | null
        }
        Update: {
          base_unit_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          short_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          password_hash: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          pincode: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          id: string
          message: string
          phone_number: string
          reference_id: string
          sent_at: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          message: string
          phone_number: string
          reference_id: string
          sent_at?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          message?: string
          phone_number?: string
          reference_id?: string
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
