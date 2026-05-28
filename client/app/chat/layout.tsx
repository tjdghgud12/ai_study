import { CatIcon } from "@/app/CatIcon";
import Link from "next/link";

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="w-full h-16 flex shrink-0">
        <Link className="p-2" href="/">
          <CatIcon className="w-full h-full" />
        </Link>
      </div>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
};

export default ChatLayout;
