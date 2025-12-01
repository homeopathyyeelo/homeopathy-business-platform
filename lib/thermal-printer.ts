/**
 * Thermal Printer Utility for TSE_TE244 and ESC/POS Printers
 * Supports direct printing via browser or network printing
 */

export interface PrinterConfig {
  name: string;
  type: 'USB' | 'NETWORK' | 'BLUETOOTH';
  ipAddress?: string;
  port?: number;
  devicePath?: string;
}

export interface PrintData {
  escposData: string;
  previewText: string;
  orderNumber?: string;
  invoiceNumber?: string;
}

/**
 * ThermalPrinterService handles thermal printing operations
 */
export class ThermalPrinterService {
  private printerConfig: PrinterConfig | null = null;

  constructor() {
    this.loadPrinterConfig();
  }

  /**
   * Load printer configuration from localStorage
   */
  private loadPrinterConfig(): void {
    const saved = localStorage.getItem('thermal_printer_config');
    if (saved) {
      this.printerConfig = JSON.parse(saved);
    }
  }

  /**
   * Save printer configuration
   */
  savePrinterConfig(config: PrinterConfig): void {
    this.printerConfig = config;
    localStorage.setItem('thermal_printer_config', JSON.stringify(config));
  }

  /**
   * Get current printer configuration
   */
  getPrinterConfig(): PrinterConfig | null {
    return this.printerConfig;
  }

  /**
   * Check if printer is configured
   */
  isPrinterConfigured(): boolean {
    return this.printerConfig !== null;
  }

  /**
   * Auto-detect TSE_TE244 printer
   */
  async detectPrinter(): Promise<PrinterConfig | null> {
    // Check if Web Serial API is available (for USB printers)
    if ('serial' in navigator) {
      try {
        // @ts-ignore - Web Serial API
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          return {
            name: 'TSE_TE244',
            type: 'USB',
            devicePath: 'AUTO_DETECTED'
          };
        }
      } catch (err) {
        console.error('Serial API error:', err);
      }
    }

    // Check for network printers (common IP ranges)
    // This is a simple heuristic - real detection would need backend support
    const commonPrinterIPs = [
      '192.168.1.100',
      '192.168.0.100',
      '10.0.0.100'
    ];

    // For now, return null - user needs to configure manually
    return null;
  }

  /**
   * Print ESC/POS data to thermal printer
   * 
   * Methods supported:
   * 1. Browser Print API (Chrome)
   * 2. Web Serial API (USB)
   * 3. Network printing (via backend proxy)
   * 4. System print dialog (fallback)
   */
  async print(printData: PrintData): Promise<void> {
    if (!this.isPrinterConfigured()) {
      throw new Error('Printer not configured. Please configure printer first.');
    }

    const config = this.printerConfig!;

    switch (config.type) {
      case 'USB':
        await this.printViaUSB(printData);
        break;
      case 'NETWORK':
        await this.printViaNetwork(printData, config);
        break;
      case 'BLUETOOTH':
        throw new Error('Bluetooth printing not yet supported');
      default:
        throw new Error('Unknown printer type');
    }
  }

  /**
   * Print via USB using Web Serial API
   */
  private async printViaUSB(printData: PrintData): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser. Use Chrome/Edge.');
    }

    try {
      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const data = encoder.encode(printData.escposData);

      await writer.write(data);
      writer.releaseLock();
      await port.close();

      console.log('Print successful via USB');
    } catch (err) {
      console.error('USB print error:', err);
      throw new Error('Failed to print via USB: ' + (err as Error).message);
    }
  }

  /**
   * Print via network (sends to backend proxy)
   */
  private async printViaNetwork(printData: PrintData, config: PrinterConfig): Promise<void> {
    try {
      const response = await fetch('/api/erp/printer/network-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escposData: printData.escposData,
          printerIP: config.ipAddress,
          printerPort: config.port || 9100,
        }),
      });

      if (!response.ok) {
        throw new Error('Network print failed');
      }

      console.log('Print successful via network');
    } catch (err) {
      console.error('Network print error:', err);
      throw new Error('Failed to print via network: ' + (err as Error).message);
    }
  }

  /**
   * Show print preview dialog
   */
  showPreview(printData: PrintData): void {
    const previewWindow = window.open('', 'Print Preview', 'width=400,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Print Preview</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                padding: 20px;
                white-space: pre-wrap;
              }
              .preview { 
                border: 1px solid #ccc; 
                padding: 10px; 
                background: #f9f9f9;
                width: 300px;
              }
              button {
                margin: 10px 5px;
                padding: 10px 20px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <h3>Thermal Print Preview (3x5")</h3>
            <div class="preview">${printData.previewText.replace(/\n/g, '<br>')}</div>
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }

  /**
   * Print using system dialog (fallback method)
   */
  async printViaSystemDialog(printData: PrintData): Promise<void> {
    // Create hidden iframe with formatted content
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Failed to create print frame');
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <style>
            @page { size: 3in 5in; margin: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 10pt; 
              margin: 0;
              padding: 5mm;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${printData.previewText.replace(/\n/g, '<br>')}</body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to load
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }
}

/**
 * Global singleton instance
 */
export const thermalPrinter = new ThermalPrinterService();

/**
 * React hook for thermal printing
 */
export function useThermalPrinter() {
  const [isConfigured, setIsConfigured] = React.useState(
    thermalPrinter.isPrinterConfigured()
  );

  const configurePrinter = React.useCallback((config: PrinterConfig) => {
    thermalPrinter.savePrinterConfig(config);
    setIsConfigured(true);
  }, []);

  const detectPrinter = React.useCallback(async () => {
    const detected = await thermalPrinter.detectPrinter();
    if (detected) {
      thermalPrinter.savePrinterConfig(detected);
      setIsConfigured(true);
    }
    return detected;
  }, []);

  const print = React.useCallback(async (printData: PrintData) => {
    try {
      await thermalPrinter.print(printData);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const showPreview = React.useCallback((printData: PrintData) => {
    thermalPrinter.showPreview(printData);
  }, []);

  const printViaDialog = React.useCallback(async (printData: PrintData) => {
    await thermalPrinter.printViaSystemDialog(printData);
  }, []);

  return {
    isConfigured,
    configurePrinter,
    detectPrinter,
    print,
    showPreview,
    printViaDialog,
    getConfig: () => thermalPrinter.getPrinterConfig(),
  };
}

// Fix React import
import React from 'react';
