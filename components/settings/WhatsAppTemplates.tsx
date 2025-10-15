import { useState, useEffect } from "react";
import { useDatabase } from "@/lib/db-client";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppTemplate } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Plus, Trash } from "lucide-react";

const WhatsAppTemplates = () => {
  const { getAll, create, update, delete: deleteRecord } = useDatabase();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<WhatsAppTemplate>>({
    name: "",
    type: "invoice",
    content: "",
    is_default: false,
  });
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getAll("whatsapp_templates");
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentTemplate((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setCurrentTemplate((prev) => ({ ...prev, is_default: checked }));
  };
  
  const handleOpenDialog = (template?: WhatsAppTemplate) => {
    if (template) {
      setCurrentTemplate({ ...template });
    } else {
      setCurrentTemplate({
        name: "",
        type: "invoice",
        content: "",
        is_default: false,
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleSave = async () => {
    try {
      if (!currentTemplate.name || !currentTemplate.content) {
        toast({
          title: "Validation Error",
          description: "Template name and content are required",
          variant: "destructive",
        });
        return;
      }
      
      // If this is set as default, unset other templates of the same type
      if (currentTemplate.is_default) {
        const sameTypeTemplates = templates.filter(
          (t) => t.type === currentTemplate.type && t.id !== currentTemplate.id && t.is_default
        );
        
        for (const template of sameTypeTemplates) {
          await update("whatsapp_templates", template.id, { is_default: false });
        }
      }
      
      if (currentTemplate.id) {
        // Update existing template
        await update("whatsapp_templates", currentTemplate.id, currentTemplate);
        toast({
          title: "Template Updated",
          description: `Template "${currentTemplate.name}" has been updated`,
        });
      } else {
        // Create new template
        await create("whatsapp_templates", {
          ...currentTemplate,
          created_at: new Date(),
          updated_at: new Date(),
        });
        toast({
          title: "Template Created",
          description: `Template "${currentTemplate.name}" has been created`,
        });
      }
      
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving WhatsApp template:", error);
      toast({
        title: "Error",
        description: "Failed to save WhatsApp template",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteRecord("whatsapp_templates", id);
        toast({
          title: "Template Deleted",
          description: "WhatsApp template has been deleted",
        });
        fetchTemplates();
      } catch (error) {
        console.error("Error deleting WhatsApp template:", error);
        toast({
          title: "Error",
          description: "Failed to delete WhatsApp template",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>WhatsApp Message Templates</CardTitle>
          <CardDescription>
            Manage templates for WhatsApp messages sent to customers
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No templates found. Add your first template.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell className="capitalize">{template.type}</TableCell>
                  <TableCell>
                    {template.is_default ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                        Default
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.content}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Template Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate.id ? "Edit Template" : "Add Template"}
            </DialogTitle>
            <DialogDescription>
              Create or edit WhatsApp message templates for customer communications
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              name="name"
              value={currentTemplate.name || ""}
              onChange={handleInputChange}
              placeholder="e.g., Invoice Notification"
            />
            
            <Label htmlFor="type">Template Type</Label>
            <Select
              name="type"
              value={currentTemplate.type || "invoice"}
              onValueChange={(value) =>
                setCurrentTemplate((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="order_status">Order Status</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              name="content"
              value={currentTemplate.content || ""}
              onChange={handleInputChange}
              placeholder="Hello {{customerName}}, your invoice #{{invoiceNumber}} for ₹{{amount}} is ready."
              className="min-h-[120px]"
            />
            <p className="text-sm text-gray-500">
              Available placeholders: <code>{"{{customerName}}"}</code>, <code>{"{{invoiceNumber}}"}</code>, <code>{"{{amount}}"}</code>
            </p>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={currentTemplate.is_default || false}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_default">Set as default template for this type</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WhatsAppTemplates;
