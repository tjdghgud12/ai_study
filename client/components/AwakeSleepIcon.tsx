"use client";

import { CatIcon, SleepCatIcon } from "@/app/CatIcon";
import { cn } from "@/lib/utils";
const AwakeSleepIcon = ({ awake, className }: { awake: boolean; className?: string }) => {
  return (
    <div className={cn("w-full h-[37.5vh] flex items-center justify-center", className)}>
      {awake ? <CatIcon className="w-full h-full aspect-square mt-auto" /> : <SleepCatIcon className="w-full h-full aspect-square" />}
    </div>
  );
};

export default AwakeSleepIcon;
