
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsApp } from "@/lib/services/whatsapp";
import { useToast } from "@/hooks/use-toast";

const WhatsAppDemo = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("100");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-" + Math.floor(Math.random() * 10000));
  const [isSending, setIsSending] = useState(false);
  
  const handleSendTest = async () => {
    if (!phoneNumber || !customerName || !amount || !invoiceNumber) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await WhatsApp.sendInvoice(
        phoneNumber,
        invoiceNumber,
        "https://example.com/invoice.pdf", // Demo URL
        customerName,
        parseFloat(amount)
      );
      
      if (result.success) {
        toast({
          title: "WhatsApp Message Sent",
          description: result.message
        });
      } else {
        toast({
          title: "Failed to Send",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending test message:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test WhatsApp Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input 
            id="name" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="invoice">Invoice Number</Label>
          <Input 
            id="invoice" 
            value={invoiceNumber} 
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-12345"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            type="number"
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendTest} 
          className="w-full"
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Send Test Message"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppDemo;
