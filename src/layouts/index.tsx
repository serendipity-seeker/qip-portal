import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SEO from "@/components/SEO";
import useGlobalTxMonitor from "@/hooks/useGlobalTxMonitor";

const Layout: React.FC = () => {
  useGlobalTxMonitor();

  return (
    <div className="relative flex min-h-screen flex-col">
      <SEO />
      <Header />
      <div className="flex flex-1 flex-col justify-center pb-16">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
