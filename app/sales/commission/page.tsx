'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, Clock,
  AlertCircle, Package, User, Calendar, DollarSign, FileText, Home,
  ShoppingCart, Printer, X, IndianRupee, Truck, MapPin, Phone, Receipt,
  FileCheck, CreditCard, Banknote, RefreshCw, TrendingUp, TrendingDown,
  Wallet, ArrowUpRight, ArrowDownRight, Building, UserCheck, Percent,
  Users, Award, Target, BarChart3, PieChart, Calculator, DollarSignIcon
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  commission_type: 'PERCENTAGE' | 'FIXED' | 'TIERED';
  commission_value: number;
  commission_rate?: number;
  applicable_to: 'ALL' | 'SALES_EXECUTIVE' | 'MANAGER' | 'AGENT';
  product_category?: string;
  min_sales_amount?: number;
  max_sales_amount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Commission {
  id: string;
  commission_no: string;
  sales_executive_id: string;
  sales_executive_name: string;
  invoice_id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  commission_type: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  payment_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function CommissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'rules' | 'commissions'>('rules');
  
  // Commission Rules state
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSearchQuery, setRulesSearchQuery] = useState('');
  const [rulesStatusFilter, setRulesStatusFilter] = useState('all');
  const [rulesCurrentPage, setRulesCurrentPage] = useState(1);
  const [rulesTotalPages, setRulesTotalPages] = useState(1);

  // Commissions state
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [commissionsSearchQuery, setCommissionsSearchQuery] = useState('');
  const [commissionsStatusFilter, setCommissionsStatusFilter] = useState('all');
  const [commissionsCurrentPage, setCommissionsCurrentPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);

  // Dialog states
  const [selectedRule, setSelectedRule] = useState<CommissionRule | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showRuleDetails, setShowRuleDetails] = useState(false);
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
  const [showEditRule, setShowEditRule] = useState(false);

  // New rule form
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    commission_type: 'PERCENTAGE',
    commission_value: '',
    commission_rate: '',
    applicable_to: 'ALL',
    product_category: '',
    min_sales_amount: '',
    max_sales_amount: '',
  });

  // Statistics
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
    paidCommissions: 0,
    totalCommissionAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  // Fetch commission rules
  const fetchCommissionRules = async () => {
    setRulesLoading(true);
    try {
      const params: any = {
        page: rulesCurrentPage,
        limit: 20,
      };

      if (rulesSearchQuery) params.search = rulesSearchQuery;
      if (rulesStatusFilter !== 'all') params.status = rulesStatusFilter;

      const res = await golangAPI.get('/api/erp/sales/commission-rules', { params });
      const data = res.data?.data || {};
      
      setCommissionRules(data.items || []);
      setRulesTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch commission rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission rules',
        variant: 'destructive',
      });
    } finally {
      setRulesLoading(false);
    }
  };

  // Fetch commissions
  const fetchCommissions = async () => {
    setCommissionsLoading(true);
    try {
      const params: any = {
        page: commissionsCurrentPage,
        limit: 20,
      };

      if (commissionsSearchQuery) params.search = commissionsSearchQuery;
      if (commissionsStatusFilter !== 'all') params.status = commissionsStatusFilter;

      const res = await golangAPI.get('/api/erp/sales/commissions', { params });
      const data = res.data?.data || {};
      
      setCommissions(data.items || []);
      setCommissionsTotalPages(data.totalPages || 1);
      
      // Calculate stats
      const commissionsData = data.items || [];
      setStats({
        totalRules: commissionRules.length,
        activeRules: commissionRules.filter((r: CommissionRule) => r.status === 'ACTIVE').length,
        totalCommissions: commissionsData.length,
        pendingCommissions: commissionsData.filter((c: Commission) => c.status === 'PENDING').length,
        approvedCommissions: commissionsData.filter((c: Commission) => c.status === 'APPROVED').length,
        paidCommissions: commissionsData.filter((c: Commission) => c.status === 'PAID').length,
        totalCommissionAmount: commissionsData.reduce((sum: number, c: Commission) => sum + c.commission_amount, 0),
        pendingAmount: commissionsData.filter((c: Commission) => c.status === 'PENDING').reduce((sum: number, c: Commission) => sum + c.commission_amount, 0),
        paidAmount: commissionsData.filter((c: Commission) => c.status === 'PAID').reduce((sum: number, c: Commission) => sum + c.commission_amount, 0),
      });
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commissions',
        variant: 'destructive',
      });
    } finally {
      setCommissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionRules();
  }, [rulesCurrentPage, rulesStatusFilter]);

  useEffect(() => {
    fetchCommissions();
  }, [commissionsCurrentPage, commissionsStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rulesSearchQuery.length >= 2 || rulesSearchQuery.length === 0) {
        setRulesCurrentPage(1);
        fetchCommissionRules();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [rulesSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (commissionsSearchQuery.length >= 2 || commissionsSearchQuery.length === 0) {
        setCommissionsCurrentPage(1);
        fetchCommissions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [commissionsSearchQuery]);

  // Create new commission rule
  const createCommissionRule = async () => {
    try {
      const ruleData = {
        ...newRule,
        commission_value: parseFloat(newRule.commission_value),
        commission_rate: newRule.commission_rate ? parseFloat(newRule.commission_rate) : null,
        min_sales_amount: newRule.min_sales_amount ? parseFloat(newRule.min_sales_amount) : null,
        max_sales_amount: newRule.max_sales_amount ? parseFloat(newRule.max_sales_amount) : null,
      };

      const res = await golangAPI.post('/api/erp/sales/commission-rules', ruleData);

      if (res.data?.success) {
        toast({
          title: 'Commission Rule Created',
          description: `Commission rule "${ruleData.name}" created successfully`,
        });
        
        fetchCommissionRules();
        setShowNewRule(false);
        setNewRule({
          name: '',
          description: '',
          commission_type: 'PERCENTAGE',
          commission_value: '',
          commission_rate: '',
          applicable_to: 'ALL',
          product_category: '',
          min_sales_amount: '',
          max_sales_amount: '',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create commission rule',
        variant: 'destructive',
      });
    }
  };

  // Update commission status
  const updateCommissionStatus = async (commissionId: string, status: string) => {
    try {
      const res = await golangAPI.put(`/api/erp/sales/commissions/${commissionId}/status`, { status });
      
      if (res.data?.success) {
        toast({
          title: 'Status Updated',
          description: `Commission status updated to ${status}`,
        });
        
        fetchCommissions();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update commission status',
        variant: 'destructive',
      });
    }
  };

  // Delete commission rule
  const deleteCommissionRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this commission rule? This action cannot be undone.')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/commission-rules/${ruleId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Rule Deleted',
          description: 'Commission rule deleted successfully',
        });
        
        fetchCommissionRules();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete commission rule',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PAID: { color: 'bg-green-100 text-green-800', icon: DollarSign },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: X },
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      ARCHIVED: { color: 'bg-orange-100 text-orange-800', icon: Archive },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Commission Management</h1>
              <p className="text-sm text-purple-100">Manage commission rules and track payments</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/invoices')}>
              <Receipt className="w-4 h-4 mr-1" />
              Invoices
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{stats.totalRules}</div>
                <div className="text-xs text-gray-600">Total Rules</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.activeRules}</div>
                <div className="text-xs text-gray-600">Active Rules</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{stats.totalCommissions}</div>
                <div className="text-xs text-gray-600">Total Commissions</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-xl font-bold">{stats.pendingCommissions}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{stats.approvedCommissions}</div>
                <div className="text-xs text-gray-600">Approved</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.paidCommissions}</div>
                <div className="text-xs text-gray-600">Paid</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalCommissionAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Amount</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.pendingAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Pending Amount</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'rules' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('rules')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Commission Rules
          </Button>
          <Button
            variant={activeTab === 'commissions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('commissions')}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Commission Tracking
          </Button>
        </div>

        {activeTab === 'rules' && (
          <>
            {/* Commission Rules Section */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by rule name, description..."
                        value={rulesSearchQuery}
                        onChange={(e) => setRulesSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={rulesStatusFilter} onValueChange={setRulesStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => setShowNewRule(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Rule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rules Table */}
            <Card>
              <CardContent className="p-0">
                {rulesLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : commissionRules.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Target className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">No Commission Rules Found</h3>
                    <p className="text-sm mb-4">Create commission rules to get started</p>
                    <Button onClick={() => setShowNewRule(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Rule
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-sm">Rule Name</th>
                          <th className="text-left p-3 font-medium text-sm">Type</th>
                          <th className="text-left p-3 font-medium text-sm">Commission</th>
                          <th className="text-left p-3 font-medium text-sm">Applicable To</th>
                          <th className="text-left p-3 font-medium text-sm">Status</th>
                          <th className="text-left p-3 font-medium text-sm">Created</th>
                          <th className="text-center p-3 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionRules.map((rule) => (
                          <tr key={rule.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium text-sm">{rule.name}</div>
                              {rule.description && (
                                <div className="text-xs text-gray-500">{rule.description}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{rule.commission_type}</Badge>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-sm text-purple-600">
                                {rule.commission_type === 'PERCENTAGE' 
                                  ? `${rule.commission_rate}%` 
                                  : `₹${rule.commission_value.toFixed(2)}`
                                }
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">{rule.applicable_to}</Badge>
                            </td>
                            <td className="p-3">
                              {getStatusBadge(rule.status)}
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {new Date(rule.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRule(rule);
                                    setShowRuleDetails(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRule(rule);
                                    setShowEditRule(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCommissionRule(rule.id)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules Pagination */}
            {rulesTotalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRulesCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={rulesCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {rulesCurrentPage} of {rulesTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRulesCurrentPage(prev => Math.min(rulesTotalPages, prev + 1))}
                  disabled={rulesCurrentPage === rulesTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === 'commissions' && (
          <>
            {/* Commissions Section */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by commission number, executive..."
                        value={commissionsSearchQuery}
                        onChange={(e) => setCommissionsSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={commissionsStatusFilter} onValueChange={setCommissionsStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={fetchCommissions} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Commissions Table */}
            <Card>
              <CardContent className="p-0">
                {commissionsLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Calculator className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">No Commissions Found</h3>
                    <p className="text-sm mb-4">Commissions will be automatically calculated based on sales</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-sm">Commission #</th>
                          <th className="text-left p-3 font-medium text-sm">Sales Executive</th>
                          <th className="text-left p-3 font-medium text-sm">Invoice #</th>
                          <th className="text-left p-3 font-medium text-sm">Invoice Date</th>
                          <th className="text-left p-3 font-medium text-sm">Status</th>
                          <th className="text-right p-3 font-medium text-sm">Total Amount</th>
                          <th className="text-right p-3 font-medium text-sm">Commission</th>
                          <th className="text-center p-3 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((commission) => (
                          <tr key={commission.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium text-sm">{commission.commission_no}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(commission.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-sm">{commission.sales_executive_name}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-mono text-sm">{commission.invoice_no}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(commission.invoice_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3">
                              {getStatusBadge(commission.status)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-semibold text-sm">₹{commission.total_amount.toFixed(2)}</div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-semibold text-sm text-purple-600">
                                {commission.commission_type === 'PERCENTAGE' 
                                  ? `${commission.commission_rate}%` 
                                  : `₹${commission.commission_amount.toFixed(2)}`
                                }
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCommission(commission);
                                    setShowCommissionDetails(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {commission.status === 'PENDING' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateCommissionStatus(commission.id, 'APPROVED')}
                                    className="h-8 w-8 p-0 text-blue-600"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {commission.status === 'APPROVED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateCommissionStatus(commission.id, 'PAID')}
                                    className="h-8 w-8 p-0 text-green-600"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commissions Pagination */}
            {commissionsTotalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommissionsCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={commissionsCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {commissionsCurrentPage} of {commissionsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommissionsCurrentPage(prev => Math.min(commissionsTotalPages, prev + 1))}
                  disabled={commissionsCurrentPage === commissionsTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rule Details Dialog */}
      <Dialog open={showRuleDetails} onOpenChange={setShowRuleDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Commission Rule Details - {selectedRule?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Rule Name</Label>
                  <div className="text-sm mt-1">{selectedRule.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Commission Type</Label>
                  <div className="text-sm mt-1">
                    <Badge variant="outline">{selectedRule.commission_type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Commission Value</Label>
                  <div className="text-sm mt-1 font-semibold text-purple-600">
                    {selectedRule.commission_type === 'PERCENTAGE' 
                      ? `${selectedRule.commission_rate}%` 
                      : `₹${selectedRule.commission_value.toFixed(2)}`
                    }
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Applicable To</Label>
                  <div className="text-sm mt-1">
                    <Badge variant="secondary">{selectedRule.applicable_to}</Badge>
                  </div>
                </div>
              </div>

              {selectedRule.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedRule.description}</div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getStatusBadge(selectedRule.status)}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedRule.created_at).toLocaleDateString()}
                </div>
              </div>

              {(selectedRule.min_sales_amount || selectedRule.max_sales_amount) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Min Sales Amount</Label>
                    <div className="text-sm mt-1">
                      {selectedRule.min_sales_amount ? `₹${selectedRule.min_sales_amount.toFixed(2)}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Sales Amount</Label>
                    <div className="text-sm mt-1">
                      {selectedRule.max_sales_amount ? `₹${selectedRule.max_sales_amount.toFixed(2)}` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {selectedRule.product_category && (
                <div>
                  <Label className="text-sm font-medium">Product Category</Label>
                  <div className="text-sm mt-1">{selectedRule.product_category}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Details Dialog */}
      <Dialog open={showCommissionDetails} onOpenChange={setShowCommissionDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Commission Details - {selectedCommission?.commission_no}
            </DialogTitle>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Commission Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedCommission.commission_no}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sales Executive</Label>
                  <div className="text-sm mt-1">{selectedCommission.sales_executive_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedCommission.invoice_no}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedCommission.invoice_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getStatusBadge(selectedCommission.status)}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">
                    Total: ₹{selectedCommission.commission_amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Invoice: ₹{selectedCommission.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Commission Type</Label>
                  <div className="text-sm mt-1">{selectedCommission.commission_type}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Commission Rate</Label>
                  <div className="text-sm mt-1 font-semibold">
                    {selectedCommission.commission_type === 'PERCENTAGE' 
                      ? `${selectedCommission.commission_rate}%` 
                      : `Fixed Amount`
                    }
                  </div>
                </div>
              </div>

              {selectedCommission.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedCommission.notes}</div>
                </div>
              )}

              {selectedCommission.payment_date && (
                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedCommission.payment_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionDetails(false)}>
              Close
            </Button>
            {selectedCommission?.status === 'PENDING' && (
              <Button
                onClick={() => {
                  updateCommissionStatus(selectedCommission.id, 'APPROVED');
                  setShowCommissionDetails(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Commission
              </Button>
            )}
            {selectedCommission?.status === 'APPROVED' && (
              <Button
                onClick={() => {
                  updateCommissionStatus(selectedCommission.id, 'PAID');
                  setShowCommissionDetails(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Rule Dialog */}
      <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Commission Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="mt-1"
                  placeholder="Enter rule name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Commission Type</Label>
                <Select value={newRule.commission_type} onValueChange={(value) => setNewRule({...newRule, commission_type: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="TIERED">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                className="mt-1"
                placeholder="Enter rule description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  {newRule.commission_type === 'PERCENTAGE' ? 'Commission Rate (%)' : 'Commission Amount (₹)'}
                </Label>
                <Input
                  type="number"
                  value={newRule.commission_type === 'PERCENTAGE' ? newRule.commission_rate : newRule.commission_value}
                  onChange={(e) => setNewRule({
                    ...newRule, 
                    [newRule.commission_type === 'PERCENTAGE' ? 'commission_rate' : 'commission_value']: e.target.value
                  })}
                  className="mt-1"
                  placeholder={newRule.commission_type === 'PERCENTAGE' ? 'Enter percentage' : 'Enter amount'}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Applicable To</Label>
                <Select value={newRule.applicable_to} onValueChange={(value) => setNewRule({...newRule, applicable_to: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="SALES_EXECUTIVE">Sales Executives</SelectItem>
                    <SelectItem value="MANAGER">Managers</SelectItem>
                    <SelectItem value="AGENT">Agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Min Sales Amount (₹)</Label>
                <Input
                  type="number"
                  value={newRule.min_sales_amount}
                  onChange={(e) => setNewRule({...newRule, min_sales_amount: e.target.value})}
                  className="mt-1"
                  placeholder="Optional minimum amount"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Sales Amount (₹)</Label>
                <Input
                  type="number"
                  value={newRule.max_sales_amount}
                  onChange={(e) => setNewRule({...newRule, max_sales_amount: e.target.value})}
                  className="mt-1"
                  placeholder="Optional maximum amount"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Product Category (Optional)</Label>
              <Input
                value={newRule.product_category}
                onChange={(e) => setNewRule({...newRule, product_category: e.target.value})}
                className="mt-1"
                placeholder="Leave empty for all products"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRule(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createCommissionRule}
              disabled={!newRule.name || !(newRule.commission_rate || newRule.commission_value)}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing icon import
import { Archive } from 'lucide-react';
