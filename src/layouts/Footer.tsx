import React from "react";
import pkg from "../../package.json";

const Footer: React.FC = () => {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };
  return (
    <footer className="border-border border-t">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
            <img src="/logo-text-short.svg" alt="logo-short" className="h-4 w-auto" />
            <div className="text-muted-foreground">
              {"\u00A9"} {getCurrentYear()} QDapp Template
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm md:flex-row">
            <a
              style={{ textDecoration: "none" }}
              className="font-space text-12 text-muted-foreground hover:text-foreground leading-12"
              target="_blank"
              rel="noreferrer"
              href="https://qubic.org/terms-of-service"
            >
              Terms of service
            </a>
            <span className="hidden text-gray-500">•</span>
            <a
              style={{ textDecoration: "none" }}
              className="font-space text-12 text-muted-foreground hover:text-foreground leading-12"
              target="_blank"
              rel="noreferrer"
              href="https://qubic.org/privacy-policy"
            >
              Privacy Policy
            </a>
            <span className="hidden text-gray-500">•</span>
            <a
              style={{ textDecoration: "none" }}
              className="font-space text-12 text-muted-foreground hover:text-foreground leading-12"
              target="_blank"
              rel="noreferrer"
              href="https://status.qubic.li/"
            >
              Network Status
            </a>
            <span className="text-12 text-gray-500">Version {pkg.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
