import Chat from "@/app/chat/page";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full flex-1 flex flex-col bg-white dark:bg-black sm:items-start">
        <Chat />
      </main>
    </div>
  );
}
