"use client";

import { useEffect, useState } from "react";

export default function DualScreenPOS() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3005/ws/pos');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'cart_update') {
        setCartItems(data.items);
        setTotal(data.total);
      }
    };
    
    setSocket(ws);
    
    return () => ws.close();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Customer Display</h1>
        
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Items</h2>
          <div className="space-y-3">
            {cartItems.map((item: any, idx) => (
              <div key={idx} className="flex justify-between text-lg">
                <span>{item.name} x {item.qty}</span>
                <span className="font-semibold">₹{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-600 text-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl">Total</span>
            <span className="text-5xl font-bold">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
