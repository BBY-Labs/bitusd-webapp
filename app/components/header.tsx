import React, { useState } from "react";
import { WalletConnector } from "./wallet";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import { Menu as MenuIcon, X as XIcon } from "lucide-react";
import { Link } from "react-router";

function Logo() {
  return <div className="text-xl font-bold">Logo</div>;
}

function NavLink({
  children,
  href = "#",
  isActive = false,
  isMobile = false,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`font-medium transition-colors duration-150 ease-in-out
      ${
        isMobile
          ? `block px-4 py-3 text-base rounded-lg ${
              isActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`
          : `px-4 py-2 rounded-full text-sm ${
              isActive
                ? "bg-gray-200 text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
      }`}
    >
      {children}
    </Link>
  );
}

function Header() {
  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Borrow", href: "/borrow" },
    { name: "Stake", href: "/stake" },
    { name: "Analytics", href: "/analytics" },
  ];
  const [activeItem, setActiveItem] = useState(navItems[0].name);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-x-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Group: Hamburger (mobile) + Logo */}
          <div className="flex items-center flex-shrink-0">
            {/* Mobile Menu Trigger - Shown only on mobile, to the left of Logo */}
            <div className="md:hidden mr-2">
              <Drawer
                open={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
              >
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left pb-2 pt-4">
                    <DrawerTitle className="flex justify-between items-center">
                      Navigation
                      <DrawerClose asChild>
                        <Button variant="ghost" size="icon">
                          <XIcon className="h-5 w-5" />
                          <span className="sr-only">Close menu</span>
                        </Button>
                      </DrawerClose>
                    </DrawerTitle>
                  </DrawerHeader>
                  <nav className="mt-2 flex flex-col space-y-1 p-4">
                    {navItems.map((item) => (
                      <DrawerClose asChild key={item.name}>
                        <NavLink
                          href={item.href}
                          isActive={activeItem === item.name}
                          isMobile
                          onClick={() => {
                            setActiveItem(item.name);
                          }}
                        >
                          {item.name}
                        </NavLink>
                      </DrawerClose>
                    ))}
                  </nav>
                </DrawerContent>
              </Drawer>
            </div>
            <Logo />
          </div>

          {/* Desktop Navigation Links - Centered */}
          <nav className="hidden md:flex flex-grow justify-center items-center space-x-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                isActive={activeItem === item.name}
                onClick={() => setActiveItem(item.name)}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Right side: Wallet Connector */}
          <div className="flex items-center justify-end">
            <WalletConnector />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
