'use client';

import { useState } from 'react';
import { Plus, ShoppingCart, MessageCircle, Bell, PanelRightOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FloatingActionButtonsProps {
  onPOSClick: () => void;
  onAIChatClick: () => void;
  onNewClick: () => void;
  onAlertsClick: () => void;
  onRightPanelClick: () => void;
}

export default function FloatingActionButtons({
  onPOSClick,
  onAIChatClick,
  onNewClick,
  onAlertsClick,
  onRightPanelClick
}: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    { label: 'New Invoice', action: '/sales/pos', icon: ShoppingCart },
    { label: 'New Product', action: '/products/new', icon: Plus },
    { label: 'New Customer', action: '/customers/new', icon: Plus },
    { label: 'New PO', action: '/purchases/orders/new', icon: Plus }
  ];

  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-3">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2">
          {/* POS Button */}
          <Button
            onClick={onPOSClick}
            size="lg"
            className="h-12 gap-2 shadow-lg"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Quick POS</span>
          </Button>

          {/* AI Chat Button */}
          <Button
            onClick={onAIChatClick}
            size="lg"
            variant="secondary"
            className="h-12 gap-2 shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            <span>AI Chat</span>
          </Button>

          {/* Alerts Button */}
          <Button
            onClick={onAlertsClick}
            size="lg"
            variant="secondary"
            className="h-12 gap-2 shadow-lg"
          >
            <Bell className="h-5 w-5" />
            <span>Alerts</span>
          </Button>

          {/* Right Panel Button */}
          <Button
            onClick={onRightPanelClick}
            size="lg"
            variant="secondary"
            className="h-12 gap-2 shadow-lg lg:hidden"
          >
            <PanelRightOpen className="h-5 w-5" />
            <span>Quick Access</span>
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              'h-14 w-14 rounded-full shadow-2xl transition-all duration-300',
              isExpanded && 'rotate-45'
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => (window.location.href = action.action)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
