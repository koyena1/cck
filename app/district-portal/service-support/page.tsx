"use client";

import { useEffect, useState } from "react";
import { SupportInbox } from "@/components/support-inbox";

interface DistrictUser {
  full_name: string;
  district: string;
}

export default function DistrictServiceSupportPage() {
  const [districtUser, setDistrictUser] = useState<DistrictUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("district_user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setDistrictUser({
        full_name: parsed?.full_name || "District Manager",
        district: parsed?.district || ""
      });
    } catch {
      setDistrictUser(null);
    }
  }, []);

  return (
    <SupportInbox
      viewerRole="district"
      viewerName={districtUser?.full_name || "District Manager"}
      district={districtUser?.district || ""}
      title="Service Support"
      subtitle="Reply to customer tickets and coordinate with dealers"
    />
  );
}
