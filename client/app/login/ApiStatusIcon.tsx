"use client";

import { CatIcon, SleepCatIcon } from "@/app/CatIcon";
const ApiStatusIcon = ({ live }: { live: boolean }) => {
  return (
    <div className="w-full h-[37.5vh] flex items-center justify-center">
      {live ? <CatIcon className="w-[30vh] h-[30vh] mt-auto" /> : <SleepCatIcon className="w-[30vh] h-[37.5vh]" />}
    </div>
  );
};

export default ApiStatusIcon;
