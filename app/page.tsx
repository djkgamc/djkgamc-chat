"use client";
import Assistant from "@/components/assistant";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useConversationStore from "@/stores/useConversationStore";

export default function Main() {
  const router = useRouter();
  const { resetConversation } = useConversationStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isConnected = new URLSearchParams(window.location.search).get("connected");
    if (isConnected === "1") {
      resetConversation();
      router.replace("/", { scroll: false });
    }
  }, [router, resetConversation]);

  return (
    <div className="flex justify-center h-screen bg-white">
      <div className="w-full max-w-4xl">
        <Assistant />
      </div>
    </div>
  );
}
