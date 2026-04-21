"use client";

import { useEffect, useState } from "react";
import { BpoServicesBoard } from "@/components/bpo-services-board";

export default function AdminBpoServicesPage() {
  const [viewerName, setViewerName] = useState("Admin");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name?.trim()) {
      setViewerName(name.trim());
    }
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10">
      <BpoServicesBoard viewerName={viewerName} viewerRole="admin" allowActions />
    </div>
  );
}
