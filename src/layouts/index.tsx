import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 justify-center pb-16">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
