"use client";

import { signInWithToken, signOut } from "@/app/api/signIn";
import { CatIcon } from "@/app/CatIcon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUserInfo } from "@/store/useUserInfo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const links = [
  { href: "/signup", label: "Sign Up" },
  { href: "/signin", label: "Sign In" },
];

const NavBar = () => {
  const { userInfo, setUserInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    toast.promise(signOut(), {
      loading: "로그아웃 중...",
      success: () => {
        setUserInfo(null);
        router.push("/signin");
        return "로그아웃을 완료하였습니다.";
      },
      error: (err) => err.message,
    });
  };

  useEffect(() => {
    signInWithToken()
      .then((res) => {
        setIsLoading(false);
        setUserInfo({ id: res.id });
      })
      .catch(() => {
        setIsLoading(false);
        setUserInfo(null);
      });
    return () => {
      setIsLoading(true);
    };
  }, []);

  return (
    <div className="h-16 flex justify-between items-center">
      <div className="h-full flex items-center shrink-0">
        <Link className="h-full p-2" href="/">
          <CatIcon className="w-full h-full" />
        </Link>
      </div>
      <div className="w-fit flex divide-x divide-gray-400">
        {isLoading ? (
          <></>
        ) : userInfo ? (
          <>
            <Label className="w-fit px-2 hover:text-primary hover:scale-105 transition-all duration-300">{userInfo?.id}</Label>
            <Button className={cn("w-fit h-auto px-2 hover:bg-transparent", pathname === "/" ? "text-primary" : "text-gray-500")} variant="ghost" onClick={handleSignOut}>
              <Label className="w-fit h-fit block hover:text-primary hover:scale-105 transition-all duration-300">Sign Out</Label>
            </Button>
          </>
        ) : (
          links.map((link) => (
            <Link key={link.href} href={link.href} className={cn("w-fit h-fit px-2", pathname === link.href ? "text-primary" : "text-gray-500")}>
              <Label className="w-fit h-fit block hover:text-primary hover:scale-105 transition-all duration-300">{link.label}</Label>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NavBar;
