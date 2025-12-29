import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SEO from "@/components/SEO";

const Layout: React.FC = () => {
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
