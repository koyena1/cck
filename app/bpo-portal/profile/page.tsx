"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, UserCircle, Briefcase, FileText } from "lucide-react";

type BpoProfile = {
  full_name: string;
  email: string;
  location: string | null;
  phone_number: string | null;
  designation: string | null;
  notes: string | null;
};

export default function BpoProfilePage() {
  const [bpoUserId, setBpoUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BpoProfile | null>(null);

  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("bpo_user");
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const userId = Number(parsed?.bpo_user_id);
      if (!Number.isFinite(userId) || userId <= 0) {
        setLoading(false);
        return;
      }
      setBpoUserId(userId);

      const loadProfile = async () => {
        try {
          const response = await fetch(`/api/bpo/profile?bpoUserId=${userId}`, { cache: "no-store" });
          const data = await response.json();
          if (!data.success) return;
          const p = data.profile as BpoProfile;
          setProfile(p);
          setLocation(p.location || "");
          setPhoneNumber(p.phone_number || "");
          setDesignation(p.designation || "");
          setNotes(p.notes || "");
        } finally {
          setLoading(false);
        }
      };

      loadProfile();
    } catch {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!bpoUserId) return;
    setSaving(true);
    try {
      const response = await fetch("/api/bpo/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bpoUserId,
          location,
          phoneNumber,
          designation,
          notes,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to save profile");
        return;
      }
      alert("Profile updated successfully");
    } catch {
      alert("Network error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading profile...</div>;
  }

  return (
    <Card className="max-w-3xl border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900"><UserCircle className="h-5 w-5 text-red-600" />BPO Profile</CardTitle>
        <CardDescription>Update your location and personal details for better coordination.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">Full Name</p>
            <Input value={profile?.full_name || ""} readOnly className="bg-slate-50" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">Email</p>
            <Input value={profile?.email || ""} readOnly className="bg-slate-50" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Location</p>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter your location" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500 flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone Number</p>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter contact number" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />Designation</p>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="BPO Executive" />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-slate-500 flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Additional Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            placeholder="Any additional details..."
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
