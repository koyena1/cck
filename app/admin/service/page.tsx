"use client";

import { useEffect, useState } from "react";
import { SupportInbox } from "@/components/support-inbox";

export default function ServicePage() {
  const [viewerName, setViewerName] = useState("Admin");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setViewerName(name);
  }, []);

  return (
    <SupportInbox
      viewerRole="admin"
      viewerName={viewerName}
      title="Service Support"
      subtitle="Customer tickets, district responses, and dealer escalations"
    />
  );
}
