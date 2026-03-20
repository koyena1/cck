"use client";

import { useEffect, useState } from "react";
import { SupportInbox } from "@/components/support-inbox";

export default function DealerServiceSupportPage() {
  const [dealerId, setDealerId] = useState<number | undefined>(undefined);
  const [dealerName, setDealerName] = useState("Dealer");

  useEffect(() => {
    const storedDealerId = localStorage.getItem("dealerId");
    const storedName = localStorage.getItem("userName");

    if (storedDealerId) {
      const parsed = Number(storedDealerId);
      if (Number.isFinite(parsed) && parsed > 0) {
        setDealerId(parsed);
      }
    }

    if (storedName) {
      setDealerName(storedName);
    }
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10">
      <SupportInbox
        viewerRole="dealer"
        viewerName={dealerName}
        dealerId={dealerId}
        title="Service Support"
        subtitle="Reply to district manager escalations for customer tickets"
      />
    </div>
  );
}
