import { useState, useRef, useEffect } from "react";
import { MdLock, MdContentCopy, MdLogout, MdRefresh } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatQubicAmount, copyText } from "@/utils";
import { useBalance } from "@/hooks/useBalance";

interface WalletDropdownProps {
  wallet: {
    connectType: string;
    publicKey: string;
    alias?: string;
  };
  onDisconnect: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({ wallet, onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { balance, assets, isLoading, refetch } = useBalance(wallet.publicKey);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyAddress = () => {
    copyText(wallet.publicKey);
  };

  const handleDisconnect = () => {
    setIsOpen(false);
    onDisconnect();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MdLock size={20} />
        <span className="hidden sm:inline">Connected</span>
      </Button>

      {isOpen && (
        <Card className="bg-background border-border absolute top-full right-0 z-50 mt-2 w-80 border p-4 shadow-lg">
          <div className="space-y-4">
            {/* Wallet Address Section */}
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm font-medium">Wallet Address</div>
              <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                <span className="flex-1 break-all font-mono text-xs">{wallet.publicKey}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-8 w-8 shrink-0 p-1">
                  <MdContentCopy size={16} />
                </Button>
              </div>
            </div>

            {/* Balance Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Balance</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-6 w-6 p-0"
                >
                  <MdRefresh size={14} className={isLoading ? "animate-spin" : ""} />
                </Button>
              </div>
              <div className="bg-muted rounded-md p-3">
                <div className="text-lg font-semibold">
                  {isLoading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <>{formatQubicAmount(balance?.balance || 0)} QUBIC</>
                  )}
                </div>
              </div>
            </div>

            {/* Token Balances Section */}
            {assets.length > 0 && (
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm font-medium">Tokens</div>
                <div className="bg-muted max-h-40 space-y-2 overflow-y-auto rounded-md p-3">
                  {assets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{asset.assetName}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatQubicAmount(asset.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            <Button variant="destructive" className="flex w-full items-center gap-2" onClick={handleDisconnect}>
              <MdLogout size={16} />
              Disconnect
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WalletDropdown;

