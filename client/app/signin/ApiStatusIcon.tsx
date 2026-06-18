"use client";

import { CatIcon, SleepCatIcon } from "@/app/CatIcon";
import { cn } from "@/lib/utils";
const ApiStatusIcon = ({ live, className }: { live: boolean; className?: string }) => {
  return (
    <div className={cn("w-full h-[37.5vh] flex items-center justify-center", className)}>
      {live ? <CatIcon className="w-full h-full aspect-square mt-auto" /> : <SleepCatIcon className="w-full h-full aspect-square" />}
    </div>
  );
};

export default ApiStatusIcon;
