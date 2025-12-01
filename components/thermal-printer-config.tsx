"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Printer, CheckCircle, AlertCircle, Wifi, Usb, Settings } from 'lucide-react'
import { useThermalPrinter, PrinterConfig } from '@/lib/thermal-printer'
import { useToast } from '@/hooks/use-toast'

interface ThermalPrinterConfigProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ThermalPrinterConfig({ open, onOpenChange }: ThermalPrinterConfigProps) {
  const { toast } = useToast()
  const { isConfigured, configurePrinter, detectPrinter, getConfig } = useThermalPrinter()
  
  const [config, setConfig] = useState<PrinterConfig>({
    name: 'TSE_TE244',
    type: 'USB',
  })
  
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    // Load existing config
    const existingConfig = getConfig()
    if (existingConfig) {
      setConfig(existingConfig)
    }
  }, [open])

  const handleDetect = async () => {
    setDetecting(true)
    try {
      const detected = await detectPrinter()
      if (detected) {
        setConfig(detected)
        toast({ title: '✅ Printer Detected', description: detected.name })
      } else {
        toast({ 
          title: 'No Printer Found', 
          description: 'Please configure manually',
          variant: 'destructive' 
        })
      }
    } catch (error) {
      toast({ title: 'Detection failed', variant: 'destructive' })
    } finally {
      setDetecting(false)
    }
  }

  const handleSave = () => {
    configurePrinter(config)
    toast({ title: '✅ Printer Configured', description: `${config.name} is ready` })
    onOpenChange(false)
  }

  const handleTest = async () => {
    // Test print - send a simple test receipt
    const testData = {
      escposData: '\x1b@\x1ba\x01\x1dE\x01TEST PRINT\x0a\x0a\x1dE\x00Printer: ' + config.name + '\x0aType: ' + config.type + '\x0a\x0a\x1ba\x01Thank You!\x0a\x0a\x0a\x1dV\x41\x03',
      previewText: '=== TEST PRINT ===\n\nPrinter: ' + config.name + '\nType: ' + config.type + '\n\nThank You!\n',
      orderNumber: 'TEST',
    }

    try {
      const { print } = useThermalPrinter()
      const result = await print(testData)
      if (result.success) {
        toast({ title: '✅ Test Print Successful' })
      } else {
        toast({ title: 'Test print failed', description: result.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Test failed', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Thermal Printer Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <span className="font-medium">
                  {isConfigured ? 'Printer Configured' : 'No Printer Configured'}
                </span>
              </div>
              <Button onClick={handleDetect} variant="outline" size="sm" disabled={detecting}>
                {detecting ? 'Detecting...' : 'Auto-Detect'}
              </Button>
            </div>
          </Card>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <Label>Printer Name</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="TSE_TE244"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your thermal printer model name
              </p>
            </div>

            <div>
              <Label>Connection Type</Label>
              <Select
                value={config.type}
                onValueChange={(value: 'USB' | 'NETWORK' | 'BLUETOOTH') =>
                  setConfig({ ...config, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USB">
                    <div className="flex items-center gap-2">
                      <Usb className="h-4 w-4" />
                      USB Connection
                    </div>
                  </SelectItem>
                  <SelectItem value="NETWORK">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Network (IP Address)
                    </div>
                  </SelectItem>
                  <SelectItem value="BLUETOOTH" disabled>
                    Bluetooth (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.type === 'NETWORK' && (
              <>
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={config.ipAddress || ''}
                    onChange={(e) =>
                      setConfig({ ...config, ipAddress: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={config.port || 9100}
                    onChange={(e) =>
                      setConfig({ ...config, port: parseInt(e.target.value) })
                    }
                    placeholder="9100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default port for ESC/POS printers is 9100
                  </p>
                </div>
              </>
            )}

            {config.type === 'USB' && (
              <Card className="p-4 bg-blue-50">
                <div className="flex gap-2">
                  <Settings className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">USB Printer Setup</p>
                    <p className="text-blue-700 mt-1">
                      Make sure your printer is connected via USB and drivers are installed.
                      Chrome/Edge browsers support direct USB printing via Web Serial API.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Printer Specifications */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">TSE_TE244 Specifications</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Paper Size: 3 inch (80mm) thermal paper</li>
              <li>• Print Format: 3x5 inch receipts</li>
              <li>• Protocol: ESC/POS commands</li>
              <li>• Auto-cut: Supported</li>
              <li>• Speed: 90mm/sec</li>
            </ul>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={handleTest} variant="outline">
            Test Print
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
