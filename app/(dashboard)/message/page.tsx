import { Metadata } from "next";
import Message from "@/components/sections/message/Message";
export const metadata: Metadata = {
  title:
    "Message | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};
// ?conversation=<id> opens that thread directly (e.g. from the dealer lead inbox).
export default async function MessagePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { conversation } = await searchParams;
  const conversationId = typeof conversation === "string" && /^\d+$/.test(conversation) ? Number(conversation) : null;

  return (
    <>
              <Message initialConversationId={conversationId} />
    </>
  );
}
