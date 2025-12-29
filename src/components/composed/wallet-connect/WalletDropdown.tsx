import { useState, useRef, useEffect } from "react";
import { MdLock, MdContentCopy, MdLogout, MdRefresh } from "react-icons/md";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatQubicAmount, copyText } from "@/utils";
import { useBalance, type AssetBalance } from "@/hooks/useBalance";
import useTransferShareManagementRights from "@/hooks/useTransferShareManagementRights";
import { QIP_SC_INDEX } from "@/utils/constants";

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
  const [recoveringAsset, setRecoveringAsset] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { balance, assetsByContract, qipAssets, isLoading, refetch } = useBalance(wallet.publicKey);
  const { handleRecoverToQX } = useTransferShareManagementRights();

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

  const handleRecover = async (asset: AssetBalance) => {
    setRecoveringAsset(asset.assetName);
    await handleRecoverToQX({
      assetName: asset.assetName,
      assetIssuer: asset.issuer,
      amount: asset.amount,
      onSuccess: async () => {
        await refetch();
        setRecoveringAsset(null);
      },
    });
    // Note: setRecoveringAsset(null) is handled in onSuccess callback after tx confirmed
  };

  const hasQIPAssets = qipAssets.length > 0;

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
        {hasQIPAssets && (
          <span className="bg-warning text-warning-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold">
            !
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="bg-background border-border absolute top-full right-0 z-50 mt-2 w-96 border p-4 shadow-lg">
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

            {/* Token Balances Section - Grouped by Contract */}
            {Object.keys(assetsByContract).length > 0 && (
              <div className="space-y-3">
                <div className="text-muted-foreground text-sm font-medium">Tokens</div>
                
                {Object.entries(assetsByContract).map(([contractName, contractAssets]) => (
                  <div key={contractName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {contractName}
                      </span>
                      {contractName === "QIP" && (
                        <span className="bg-warning/20 text-warning rounded px-1.5 py-0.5 text-xs">
                          Locked
                        </span>
                      )}
                    </div>
                    <div className="bg-muted max-h-32 space-y-1 overflow-y-auto rounded-md p-2">
                      {contractAssets.map((asset, index) => (
                        <div
                          key={`${contractName}-${asset.assetName}-${index}`}
                          className="flex items-center justify-between gap-2 rounded p-1"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{asset.assetName}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatQubicAmount(asset.amount)}
                            </span>
                          </div>
                          
                          {/* Show recover button for QIP assets */}
                          {asset.managingContractIndex === QIP_SC_INDEX && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecover(asset)}
                              disabled={recoveringAsset === asset.assetName}
                              className="h-7 gap-1 px-2 text-xs"
                              title="Transfer back to QX to enable trading"
                            >
                              {recoveringAsset === asset.assetName ? (
                                <MdRefresh size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <ArrowRight size={12} />
                                  <span>To QX</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Warning for QIP assets */}
                {hasQIPAssets && (
                  <div className="bg-warning/10 border-warning/20 rounded-md border p-2">
                    <p className="text-warning text-xs">
                      <strong>Note:</strong> Tokens in QIP contract cannot be traded on QX. 
                      Click "To QX" to transfer them back for trading.
                    </p>
                  </div>
                )}
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
