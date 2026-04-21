"use client";

import AdminOrdersPage from "@/app/admin/orders/page";

export default function BpoOrdersPage() {
  // Reuse the same Orders experience as Admin to keep parity across portals.
  return <AdminOrdersPage />;
}
