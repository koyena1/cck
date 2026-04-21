"use client";

import { useEffect, useState } from "react";
import { BpoServicesBoard } from "@/components/bpo-services-board";

export default function BpoServiceRequestsPage() {
  const [viewerName, setViewerName] = useState("BPO Agent");

  useEffect(() => {
    const raw = localStorage.getItem("bpo_user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const name = String(parsed?.full_name || "").trim();
      if (name) setViewerName(name);
    } catch {
      // ignore invalid storage state
    }
  }, []);

  return <BpoServicesBoard viewerName={viewerName} viewerRole="bpo" allowActions />;
}
