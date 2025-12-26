import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";
import { QubicConnectProvider } from "./components/composed/wallet-connect/QubicConnectContext.tsx";
import { WalletConnectProvider } from "./components/composed/wallet-connect/WalletConnectContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletConnectProvider>
        <QubicConnectProvider>
        <App />
          
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!bg-card !text-card-foreground !border-border !border",
            }}
          />
        </QubicConnectProvider>
      </WalletConnectProvider>
    
  </StrictMode>,
);
