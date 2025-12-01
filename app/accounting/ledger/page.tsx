"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, FileText, Download, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface LedgerAccount {
    id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    currentBalance: number;
    isActive: boolean;
}

interface JournalEntry {
    id: string;
    entryNumber: string;
    entryDate: string;
    description: string;
    referenceType: string;
    referenceId: string;
    lines: JournalEntryLine[];
}

interface JournalEntryLine {
    id: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
}

export default function LedgerDashboard() {
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:3005/api/erp/ledger/accounts", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setAccounts(data.accounts || []);
            } else {
                toast.error("Failed to fetch accounts");
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const filteredAccounts = accounts.filter(acc =>
        acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountCode.includes(searchTerm)
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ASSET': return 'bg-blue-100 text-blue-800';
            case 'LIABILITY': return 'bg-red-100 text-red-800';
            case 'EQUITY': return 'bg-purple-100 text-purple-800';
            case 'REVENUE': return 'bg-green-100 text-green-800';
            case 'EXPENSE': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Accounting Ledger</h1>
                    <p className="text-muted-foreground">Manage chart of accounts and view financial reports</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAccounts}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Journal Entry
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(accounts
                                .filter(a => a.accountType === 'ASSET')
                                .reduce((sum, a) => sum + a.currentBalance, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(accounts
                                .filter(a => a.accountType === 'LIABILITY')
                                .reduce((sum, a) => sum + a.currentBalance, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit (YTD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                                accounts.filter(a => a.accountType === 'REVENUE').reduce((sum, a) => sum + a.currentBalance, 0) -
                                accounts.filter(a => a.accountType === 'EXPENSE').reduce((sum, a) => sum + a.currentBalance, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Chart of Accounts</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search accounts..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading accounts...</TableCell>
                                </TableRow>
                            ) : filteredAccounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">No accounts found</TableCell>
                                </TableRow>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-mono">{account.accountCode}</TableCell>
                                        <TableCell className="font-medium">{account.accountName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getTypeColor(account.accountType)}>
                                                {account.accountType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(account.currentBalance)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={account.isActive ? "default" : "destructive"}>
                                                {account.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
