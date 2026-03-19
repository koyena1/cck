"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DistrictPortalHome() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem('district_user');
    
    if (userData) {
      router.push('/district-portal/dashboard');
    } else {
      router.push('/district-portal/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
