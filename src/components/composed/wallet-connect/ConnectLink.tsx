import { MdLockOpen } from "react-icons/md";
import ConnectModal from "./ConnectModal";
import { useQubicConnect } from "./QubicConnectContext";
import { Button } from "@/components/ui/button";
import WalletDropdown from "./WalletDropdown";

const ConnectLink: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const { connected, wallet, disconnect, showConnectModal, toggleConnectModal } = useQubicConnect();

  return (
    <>
      {connected && wallet ? (
        <WalletDropdown wallet={wallet} onDisconnect={disconnect} />
      ) : (
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => toggleConnectModal()}
          type="button"
        >
          <MdLockOpen size={20} />
          <span>Connect Wallet</span>
        </Button>
      )}
      <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal()} darkMode={darkMode} />
    </>
  );
};

export default ConnectLink;
