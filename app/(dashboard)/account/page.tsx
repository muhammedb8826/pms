"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useUpdateAccountMutation, useChangePasswordMutation } from "@/features/auth/api/accountApi";
import type { User as AuthUser } from "@/features/auth/types";
import { ImageUpload } from "@/components/ui/image-upload";

const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

interface UpdateAccountResponseData {
  profile?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
}

function resolveProfileUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    try {
      const url = new URL(base);
      return `${url.origin}${path.startsWith("/") ? path : `/${path}`}`;
    } catch {
      // ignore and fall back
    }
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateAccountMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const defaultProfileSrc = useMemo(() => resolveProfileUrl(user?.profile ?? undefined), [user?.profile]);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    middleName: user?.middleName ?? "",
    lastName: user?.lastName ?? "",
    gender: user?.gender ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultProfileSrc);
  const objectUrlRef = useRef<string | null>(null);

  const rawRoles = user?.roles;
  const rolesArray = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === "string" && rawRoles.length > 0
    ? rawRoles.split(",").map((role) => role.trim()).filter(Boolean)
    : [];

  const displayName = useMemo(() => {
    if (!user) return "Account";
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return full || user.email || "Account";
  }, [user]);

  const initials = useMemo(() => {
    return (
      displayName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AC"
    );
  }, [displayName]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName ?? "",
      middleName: user?.middleName ?? "",
      lastName: user?.lastName ?? "",
      gender: user?.gender ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (!profileFile) {
      setAvatarPreview(defaultProfileSrc);
    }
  }, [defaultProfileSrc, profileFile]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleProfileImageChange = (file: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setProfileFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAvatarPreview(url);
    } else {
      setAvatarPreview(defaultProfileSrc);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt={displayName} />
            ) : (
              <AvatarFallback className="rounded-lg text-base font-semibold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and account preferences.
            </p>
            {rolesArray.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rolesArray.map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <h2 className="text-base font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Update your personal details.</p>
          {profileError ? (
            <div className="mt-4 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
              {profileError}
            </div>
          ) : null}
          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileError(null);
              try {
                const formData = new FormData();
                const trimmedFirst = profileForm.firstName.trim();
                const trimmedMiddle = profileForm.middleName.trim();
                const trimmedLast = profileForm.lastName.trim();
                const trimmedPhone = profileForm.phone.trim();
                const trimmedAddress = profileForm.address.trim();

                if (!trimmedFirst) {
                  setProfileError("First name is required");
                  return;
                }
                if (!trimmedPhone) {
                  setProfileError("Phone number is required");
                  return;
                }

                if (trimmedFirst) formData.append("firstName", trimmedFirst);
                if (trimmedMiddle || profileForm.middleName.length === 0) formData.append("middleName", trimmedMiddle);
                if (trimmedLast || profileForm.lastName.length === 0) formData.append("lastName", trimmedLast);
                if (profileForm.gender) formData.append("gender", profileForm.gender);
                if (trimmedPhone) formData.append("phone", trimmedPhone);
                if (trimmedAddress || profileForm.address.length === 0) formData.append("address", trimmedAddress);
                if (profileFile) formData.append("profile", profileFile);

                const response = await updateProfile(formData).unwrap();
                const updatedData =
                  response && typeof response === "object" && "data" in response
                    ? (response as { data?: UpdateAccountResponseData }).data
                    : undefined;

                const updatedProfilePath =
                  updatedData && typeof updatedData === "object" && "profile" in updatedData
                    ? (updatedData as { profile?: string }).profile ?? undefined
                    : profileFile
                    ? user?.profile
                    : user?.profile;

                const nextPartial: Partial<AuthUser> = {};
                if (updatedData?.firstName !== undefined) {
                  nextPartial.firstName = updatedData.firstName ?? null;
                } else if (trimmedFirst) {
                  nextPartial.firstName = trimmedFirst;
                }
                if (updatedData?.middleName !== undefined) {
                  nextPartial.middleName = updatedData.middleName ?? null;
                } else if (profileForm.middleName.length === 0 || trimmedMiddle) {
                  nextPartial.middleName = trimmedMiddle || null;
                }
                if (updatedData?.lastName !== undefined) {
                  nextPartial.lastName = updatedData.lastName ?? null;
                } else if (profileForm.lastName.length === 0 || trimmedLast) {
                  nextPartial.lastName = trimmedLast || null;
                }
                if (updatedData?.gender !== undefined) {
                  nextPartial.gender = updatedData.gender ?? null;
                } else if (profileForm.gender) {
                  nextPartial.gender = profileForm.gender;
                }
                if (updatedData?.phone !== undefined) {
                  nextPartial.phone = updatedData.phone ?? trimmedPhone ?? user?.phone ?? "";
                } else if (trimmedPhone) {
                  nextPartial.phone = trimmedPhone;
                }
                if (updatedData?.address !== undefined) {
                  nextPartial.address = updatedData.address ?? null;
                } else if (profileForm.address.length === 0 || trimmedAddress) {
                  nextPartial.address = trimmedAddress || null;
                }
                if (updatedProfilePath !== undefined) {
                  nextPartial.profile = updatedProfilePath ?? null;
                }

                if (Object.keys(nextPartial).length > 0) {
                  updateUser(nextPartial);
                }
                if (objectUrlRef.current) {
                  URL.revokeObjectURL(objectUrlRef.current);
                  objectUrlRef.current = null;
                }
                setProfileFile(null);
                toast.success("Profile updated");
              } catch (err) {
                const message =
                  (err as { data?: { message?: string | string[] } })?.data?.message ??
                  "Failed to update profile";
                setProfileError(Array.isArray(message) ? message.join(", ") : String(message));
                toast.error("Failed to update profile");
              }
            }}
          >
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Profile photo</label>
              <ImageUpload
                value={avatarPreview ?? undefined}
                onChange={handleProfileImageChange}
                onRemove={() => handleProfileImageChange(null)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">First name</label>
                <Input
                  value={profileForm.firstName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Last name</label>
                <Input
                  value={profileForm.lastName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Middle name</label>
                <Input
                  value={profileForm.middleName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev) => ({ ...prev, middleName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Gender</label>
                <Select
                  value={profileForm.gender}
                  onValueChange={(value) =>
                    setProfileForm((prev) => ({ ...prev, gender: value ?? "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Phone</label>
                <Input
                  value={profileForm.phone}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Address</label>
              <Textarea
                value={profileForm.address}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setProfileForm((prev) => ({ ...prev, address: event.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updatingProfile}>
                {updatingProfile ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <h2 className="text-base font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">Account status and security.</p>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={user?.is_active ? "default" : "outline"}>
                  {user?.is_active ? "Active" : "Inactive"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">
                {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold">Change password</h3>
            <p className="text-xs text-muted-foreground">
              Enter your current password and choose a new one.
            </p>
            {passwordError ? (
              <div className="mt-4 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
                {passwordError}
              </div>
            ) : null}
            <form
              className="mt-4 space-y-3 text-sm"
              onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setPasswordError(null);
                if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
                  setPasswordError("Password must be at least 6 characters");
                  return;
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                  setPasswordError("New passwords do not match");
                  return;
                }
                try {
                  await changePassword({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmPassword: passwordForm.confirmPassword,
                  }).unwrap();
                  toast.success("Password updated");
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                } catch (err) {
                  const message =
                    (err as { data?: { message?: string | string[] } })?.data?.message ??
                    "Failed to change password";
                  setPasswordError(Array.isArray(message) ? message.join(", ") : String(message));
                  toast.error("Failed to change password");
                }
              }}
            >
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Current password</label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                  autoComplete="current-password"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">New password</label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Confirm password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Updating…" : "Change password"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}


