"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { usePharmacySettings, useUpdatePharmacySettings, useUploadPharmacyLogo } from "@/features/settings/hooks/useSettings";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

export default function PharmacySettingsPage() {
  const { settings, isLoading, error, refetch } = usePharmacySettings();
  const updateMutation = useUpdatePharmacySettings();
  const uploadLogoMutation = useUploadPharmacyLogo();

  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyLogoUrl, setPharmacyLogoUrl] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!settings) return;
    setPharmacyName(settings.pharmacyName ?? "");
    setPharmacyLogoUrl(settings.pharmacyLogoUrl ?? "");
    setLogoDataUrl(null);
    setAddress(settings.address ?? "");
    setPhone(settings.phone ?? "");
    setEmail(settings.email ?? "");
  }, [settings]);

  const handleLogoFileChange = (file: File | null) => {
    if (!file) {
      setLogoDataUrl(null);
      setLogoFile(null);
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        pharmacyName: pharmacyName || undefined,
        pharmacyLogoUrl:
          pharmacyLogoUrl && pharmacyLogoUrl.trim().length > 0
            ? pharmacyLogoUrl.trim()
            : undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      handleApiSuccess("Pharmacy settings updated");
      refetch();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to update pharmacy settings" });
    }
  }

  if (isLoading && !settings) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load settings.</div>;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-xl">
      <h1 className="text-xl font-semibold">Pharmacy Settings</h1>
      <p className="text-sm text-muted-foreground">
        Configure the pharmacy name, logo, and contact information used across the dashboard and vouchers.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="pharmacyName">Pharmacy Name</Label>
          <Input
            id="pharmacyName"
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <ImageUpload
            value={logoDataUrl ?? pharmacyLogoUrl ?? undefined}
            onChange={handleLogoFileChange}
            onRemove={async () => {
              setLogoDataUrl(null);
              setPharmacyLogoUrl("");
              setLogoFile(null);
              try {
                await updateMutation.mutateAsync({
                  pharmacyLogoUrl: "",
                });
                handleApiSuccess("Logo removed");
                refetch();
              } catch (err) {
                handleApiError(err, { defaultMessage: "Failed to remove logo" });
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  if (logoFile) {
                    await uploadLogoMutation.mutateAsync(logoFile);
                    handleApiSuccess("Logo uploaded");
                    setLogoFile(null);
                    setLogoDataUrl(null);
                    refetch();
                  } else {
                    await updateMutation.mutateAsync({
                      pharmacyLogoUrl:
                        pharmacyLogoUrl && pharmacyLogoUrl.trim().length > 0
                          ? pharmacyLogoUrl.trim()
                          : undefined,
                    });
                    handleApiSuccess("Logo updated");
                    refetch();
                  }
                } catch (err) {
                  handleApiError(err, { defaultMessage: "Failed to update logo" });
                }
              }}
              disabled={updateMutation.isPending || uploadLogoMutation.isPending}
            >
              {uploadLogoMutation.isPending || updateMutation.isPending ? "Uploading…" : "Upload Logo"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can upload a logo image (stored as a data URL) or use a direct URL below.
          </p>
          <Input
            id="pharmacyLogoUrl"
            value={pharmacyLogoUrl}
            onChange={(e) => setPharmacyLogoUrl(e.target.value)}
            placeholder="/uploads/logo/abc.png or https://…"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}



