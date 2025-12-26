import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import ConnectLink from "@/components/composed/wallet-connect/ConnectLink";
import { useAtom } from "jotai";
import { settingsAtom } from "@/store/settings";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [settings, setSettings] = useAtom(settingsAtom);

  const navigation = [{ name: "Home", href: "/" }];

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setSettings({ darkMode: !settings.darkMode });
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="bg-background border-border sticky top-0 z-50 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="transition-opacity hover:opacity-80">
            <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} src={"/qubic.svg"} alt="logo" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden space-x-8 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-1 text-sm font-medium transition-colors ${isActive(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                style={{ borderRadius: 0, background: "none" }}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button onClick={toggleTheme}>
              {!settings.darkMode ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
            </Button>

            {/* Wallet Button */}
            <ConnectLink darkMode={true} />
          </div>


          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-2 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-border bg-background border-t py-4 md:hidden">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {item.name}
                </Link>
              ))}
              <ConnectLink darkMode={true} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
