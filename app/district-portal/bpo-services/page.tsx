"use client";

import { useEffect, useState } from "react";
import { BpoServicesBoard } from "@/components/bpo-services-board";

export default function DistrictBpoServicesPage() {
  const [viewerName, setViewerName] = useState("District Manager");

  useEffect(() => {
    const stored = localStorage.getItem("district_user");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.full_name) {
        setViewerName(parsed.full_name);
      }
    } catch {
      setViewerName("District Manager");
    }
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10">
      <BpoServicesBoard viewerName={viewerName} viewerRole="district" allowActions />
    </div>
  );
}
