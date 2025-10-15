import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for{" "}
            <span className="font-medium text-foreground">YEELO HOMEOPATHY</span>
            . Complete ERP Management System.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-xs text-muted-foreground">
            v2.0.0 | PostgreSQL Compatible
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;