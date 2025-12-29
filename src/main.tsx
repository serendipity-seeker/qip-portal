import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";
import { QubicConnectProvider } from "./components/composed/wallet-connect/QubicConnectContext.tsx";
import { WalletConnectProvider } from "./components/composed/wallet-connect/WalletConnectContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <WalletConnectProvider>
        <QubicConnectProvider>
          <App />
          <Toaster position="top-right" theme="dark" richColors closeButton swipeDirections={["right", "left"]} />
        </QubicConnectProvider>
      </WalletConnectProvider>
    </HelmetProvider>
  </StrictMode>,
);
