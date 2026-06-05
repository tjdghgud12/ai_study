const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
};

export default ChatLayout;
