"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, UserPlus, Clock, DollarSign, Calendar, TrendingUp,
  CheckCircle, XCircle, AlertCircle, FileText, Download
} from "lucide-react";
import DataTable from "@/components/common/DataTable";

export default function HRPage() {
  const [activeTab, setActiveTab] = useState("employees");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual API calls
  const employees = [
    { id: 1, name: "Rajesh Kumar", role: "Store Manager", department: "Sales", salary: 35000, status: "active", joining_date: "2023-01-15" },
    { id: 2, name: "Priya Sharma", role: "Cashier", department: "Sales", salary: 18000, status: "active", joining_date: "2023-03-20" },
    { id: 3, name: "Amit Patel", role: "Pharmacist", department: "Pharmacy", salary: 28000, status: "active", joining_date: "2022-11-10" },
    { id: 4, name: "Sneha Desai", role: "Inventory Manager", department: "Operations", salary: 32000, status: "active", joining_date: "2023-05-01" },
  ];

  const attendance = [
    { id: 1, employee: "Rajesh Kumar", date: "2025-10-24", check_in: "09:00 AM", check_out: "06:00 PM", status: "present" },
    { id: 2, employee: "Priya Sharma", date: "2025-10-24", check_in: "09:15 AM", check_out: "06:05 PM", status: "present" },
    { id: 3, employee: "Amit Patel", date: "2025-10-24", check_in: "-", check_out: "-", status: "absent" },
  ];

  const leaves = [
    { id: 1, employee: "Amit Patel", type: "Sick Leave", from: "2025-10-24", to: "2025-10-25", days: 2, status: "approved" },
    { id: 2, employee: "Sneha Desai", type: "Casual Leave", from: "2025-10-28", to: "2025-10-28", days: 1, status: "pending" },
  ];

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    presentToday: attendance.filter(a => a.status === "present").length,
    totalPayroll: employees.reduce((sum, emp) => sum + emp.salary, 0),
    pendingLeaves: leaves.filter(l => l.status === "pending").length,
  };

  const employeeColumns = [
    { key: "id", title: "ID", sortable: true },
    { key: "name", title: "Name", sortable: true },
    { key: "role", title: "Role", sortable: true },
    { key: "department", title: "Department", sortable: true },
    { 
      key: "salary", 
      title: "Salary", 
      sortable: true,
      render: (val: number) => `₹${val.toLocaleString()}`
    },
    { 
      key: "status", 
      title: "Status", 
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val}
        </Badge>
      )
    },
  ];

  const attendanceColumns = [
    { key: "employee", title: "Employee", sortable: true },
    { key: "date", title: "Date", sortable: true },
    { key: "check_in", title: "Check In" },
    { key: "check_out", title: "Check Out" },
    { 
      key: "status", 
      title: "Status",
      render: (val: string) => (
        <Badge variant={val === "present" ? "default" : "destructive"}>
          {val}
        </Badge>
      )
    },
  ];

  const leaveColumns = [
    { key: "employee", title: "Employee", sortable: true },
    { key: "type", title: "Leave Type", sortable: true },
    { key: "from", title: "From" },
    { key: "to", title: "To" },
    { key: "days", title: "Days" },
    { 
      key: "status", 
      title: "Status",
      render: (val: string) => (
        <Badge variant={val === "approved" ? "default" : val === "pending" ? "secondary" : "destructive"}>
          {val}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-500" />
            Human Resources
          </h1>
          <p className="text-gray-600 mt-1">Manage employees, attendance, payroll, and leaves</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">All staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">Out of {stats.totalEmployees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-500" />
              Monthly Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Need approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Leaves
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage all employees and their information</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={employeeColumns}
                data={employees}
                actions={[
                  { label: "Edit", onClick: (row) => console.log("Edit", row) },
                  { label: "Delete", onClick: (row) => console.log("Delete", row), variant: "destructive" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Track employee attendance and working hours</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={attendanceColumns} data={attendance} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Review and approve employee leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={leaveColumns}
                data={leaves}
                actions={[
                  { label: "Approve", onClick: (row) => console.log("Approve", row) },
                  { label: "Reject", onClick: (row) => console.log("Reject", row), variant: "destructive" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
              <CardDescription>Monthly salary breakdown and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Total Payroll</div>
                    <div className="text-2xl font-bold text-gray-900">₹{stats.totalPayroll.toLocaleString()}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Processed</div>
                    <div className="text-2xl font-bold text-green-600">₹0</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-2xl font-bold text-orange-600">₹{stats.totalPayroll.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No payroll processed this month</p>
                  <Button className="mt-4">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Payroll
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
