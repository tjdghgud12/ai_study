"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CatIcon } from "./CatIcon";

const links = [
  { href: "/signup", label: "Sign Up" },
  { href: "/signin", label: "Sign In" },
];

const NavBar = () => {
  const pathname = usePathname();

  return (
    <div className="h-16 flex justify-between items-center">
      <div className="h-full flex items-center shrink-0">
        <Link className="h-full p-2" href="/">
          <CatIcon className="w-full h-full" />
        </Link>
      </div>
      <div className="w-fit flex divide-x divide-gray-400">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={cn("w-fit h-fit px-2", pathname === link.href ? "text-primary" : "text-gray-500")}>
            <span className="w-fit h-fit block hover:text-primary hover:scale-105 transition-all duration-300">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavBar;
