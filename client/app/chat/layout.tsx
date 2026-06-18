const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden font-sans bg-white dark:bg-black sm:items-start">{children}</main>;
};

export default ChatLayout;
