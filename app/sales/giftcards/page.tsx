"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function GiftCardsPage() {
  const [amount, setAmount] = useState(0);
  const [code, setCode] = useState("");

  const generateCard = async () => {
    const res = await fetch('http://localhost:3005/api/erp/giftcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (res.ok) {
      const data = await res.json();
      setCode(data.code);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Gift Cards & Vouchers</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Issued</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹45,000</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Redeemed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹32,000</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹13,000</div></CardContent>
        </Card>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Issue New Gift Card</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>New Gift Card</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            <Button onClick={generateCard} className="w-full">Generate</Button>
            {code && <div className="p-4 bg-green-50 rounded font-mono text-lg">{code}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
