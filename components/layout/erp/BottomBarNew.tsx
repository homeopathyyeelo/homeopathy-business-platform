'use client';

import { useState, useEffect } from 'react';
import {
  Wifi, WifiOff, Database, HardDrive, Clock, Activity, Zap,
  Info, AlertCircle, CheckCircle, RefreshCw, Brain, Lightbulb,
  ShoppingCart, MessageCircle, Bell, ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BottomBarProps {
  systemStatus?: {
    apiHealth: 'online' | 'offline' | 'degraded';
    kafkaStatus: 'connected' | 'disconnected';
    lastSync: Date;
    backupStatus: 'success' | 'pending' | 'failed';
  };
  currentUser?: {
    name: string;
    loginTime: Date;
  };
  aiMode?: 'business' | 'doctor' | 'marketing';
  onAIModeChange?: (mode: 'business' | 'doctor' | 'marketing') => void;
}

export default function BottomBar({
  systemStatus = {
    apiHealth: 'online',
    kafkaStatus: 'connected',
    lastSync: new Date(),
    backupStatus: 'success'
  },
  currentUser,
  aiMode = 'business',
  onAIModeChange
}: BottomBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionDuration, setSessionDuration] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [aiTip, setAiTip] = useState('');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (currentUser?.loginTime) {
        const duration = Date.now() - currentUser.loginTime.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        setSessionDuration(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  // AI Tips rotation
  useEffect(() => {
    const tips = [
      'Try "/ai sales insight" for quick analysis',
      'Press F1 for quick POS access',
      'Use Ctrl+K for global search',
      'AI can generate purchase orders automatically',
      'Check expiry alerts in the right panel'
    ];
    
    setAiTip(tips[Math.floor(Math.random() * tips.length)]);
    
    const tipTimer = setInterval(() => {
      setAiTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 10000);

    return () => clearInterval(tipTimer);
  }, []);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'success':
        return 'text-green-500';
      case 'offline':
      case 'disconnected':
      case 'failed':
        return 'text-red-500';
      case 'degraded':
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'success':
        return CheckCircle;
      case 'offline':
      case 'disconnected':
      case 'failed':
        return AlertCircle;
      case 'degraded':
      case 'pending':
        return RefreshCw;
      default:
        return Info;
    }
  };

  const formatLastSync = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-8 bg-card border-t border-border z-30 px-4">
      <div className="flex items-center justify-between h-full text-xs">
        {/* Left Section - System Status */}
        <div className="flex items-center gap-4">
          {/* API Health */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  {systemStatus.apiHealth === 'online' ? (
                    <Wifi className={cn('h-3.5 w-3.5', getStatusColor(systemStatus.apiHealth))} />
                  ) : (
                    <WifiOff className={cn('h-3.5 w-3.5', getStatusColor(systemStatus.apiHealth))} />
                  )}
                  <span className="text-muted-foreground">API</span>
                  <div className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(systemStatus.apiHealth))} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>API Status: {systemStatus.apiHealth}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Kafka Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <Activity className={cn('h-3.5 w-3.5', getStatusColor(systemStatus.kafkaStatus))} />
                  <span className="text-muted-foreground">Events</span>
                  <div className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(systemStatus.kafkaStatus))} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kafka: {systemStatus.kafkaStatus}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Last Sync */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Sync: {formatLastSync(systemStatus.lastSync)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last synced: {systemStatus.lastSync.toLocaleTimeString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Backup Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <HardDrive className={cn('h-3.5 w-3.5', getStatusColor(systemStatus.backupStatus))} />
                  <span className="text-muted-foreground">Backup</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last backup: {systemStatus.backupStatus}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Center Section - Time & Session */}
        <div className="flex items-center gap-4">
          {/* Current Time */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Session Duration */}
          {currentUser && sessionDuration && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{sessionDuration}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Session duration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* AI Tip */}
          <div className="hidden lg:flex items-center gap-1.5 max-w-xs">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-muted-foreground truncate">{aiTip}</span>
          </div>
        </div>

        {/* Right Section - Quick Actions & Info */}
        <div className="flex items-center gap-3">
          {/* AI Mode Switcher */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5 text-purple-500" />
                  <select
                    value={aiMode}
                    onChange={(e) => onAIModeChange?.(e.target.value as any)}
                    className="bg-transparent text-xs text-muted-foreground border-none outline-none cursor-pointer"
                  >
                    <option value="business">Business AI</option>
                    <option value="doctor">Doctor AI</option>
                    <option value="marketing">Marketing AI</option>
                  </select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch AI Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Quick Shortcuts */}
          <div className="hidden md:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.location.href = '/sales/pos'}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick POS (F1)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alerts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Version Info */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">v2.1.0</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>HomeoERP v2.1.0</p>
                <p className="text-xs text-muted-foreground">© 2025 Yeelo Homeopathy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-12 right-6 h-10 w-10 rounded-full shadow-lg z-50"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </footer>
  );
}
