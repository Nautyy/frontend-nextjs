import type { Metadata } from "next";
import ChatApp from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Plum Claims Review Console",
  description: "Internal claims adjudication review for Plum ops team",
};

export default function OpsPage() {
  return <ChatApp audience="ops" />;
}
