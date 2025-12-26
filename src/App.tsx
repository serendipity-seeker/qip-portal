import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/layouts";
import Error404 from "@/pages/error404";
import Home from "@/pages/home";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { useContext, useEffect } from "react";
import { useAtom } from "jotai";
import { settingsAtom } from "@/store/settings";
import { MetaMaskContext } from "./components/composed/wallet-connect/MetamaskContext";
import useRPCDataFetcher from "./hooks/useRPCDataFether";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error404 />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
    ],
  },
]);

function App() {
  // useRPCDataFetcher();

  const [settings] = useAtom(settingsAtom);
  const [state] = useContext(MetaMaskContext);
  const { connect, mmSnapConnect } = useQubicConnect();

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      connect(JSON.parse(storedWallet));
    } else if (state.installedSnap) {
      mmSnapConnect();
    }
  }, [state]);

  useEffect(() => {
    console.log("settings", settings.darkMode);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(settings.darkMode ? "dark" : "light");
  }, [settings.darkMode]);

  return (
    <div className={"bg-background text-foreground"}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
