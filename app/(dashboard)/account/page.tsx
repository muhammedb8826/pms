"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUpdateProfileMutation, useChangePasswordMutation, useUploadAvatarMutation } from "@/features/auth/api/accountApi";
import type { User as AuthUser } from "@/features/auth/types";
import { ImageUpload } from "@/components/ui/image-upload";


function resolveProfileUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // Get API base URL and extract origin
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    try {
      const url = new URL(base);
      // Ensure path starts with / for proper URL construction
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${url.origin}${normalizedPath}`;
    } catch {
      // If base URL parsing fails, fall back to window origin
    }
  }
  
  // Fallback to current window origin
  if (typeof window !== "undefined") {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${window.location.origin}${normalizedPath}`;
  }
  
  return path;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const defaultProfileSrc = useMemo(() => resolveProfileUrl(user?.avatarUrl ?? user?.avatar ?? undefined), [user?.avatarUrl, user?.avatar]);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });

  const [passwordForm, setPasswordForm] = useState<{
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultProfileSrc);
  const objectUrlRef = useRef<string | null>(null);

  const userRole = user?.role;

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
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
    });
  }, [user]);

  useEffect(() => {
    // Only update preview from user state if no file is currently selected
    if (!profileFile) {
      const resolvedUrl = resolveProfileUrl(user?.avatarUrl ?? user?.avatar ?? undefined);
      if (resolvedUrl) {
        setAvatarPreview(resolvedUrl);
      } else {
        setAvatarPreview(null);
      }
    }
  }, [profileFile, user?.avatarUrl, user?.avatar]);

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
            {userRole ? (
              <div className="mt-3">
                <Badge variant="secondary" className="capitalize">
                  {userRole.replace(/_/g, " ").toLowerCase()}
                </Badge>
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
                const trimmedFirst = profileForm.firstName.trim();
                const trimmedLast = profileForm.lastName.trim();
                const trimmedPhone = profileForm.phone.trim();
                const trimmedAddress = profileForm.address.trim();

                // Update profile fields (firstName, lastName, phone, address only)
                const profileData: { firstName?: string; lastName?: string; phone?: string; address?: string } = {};
                if (trimmedFirst) profileData.firstName = trimmedFirst;
                if (trimmedLast) profileData.lastName = trimmedLast;
                if (trimmedPhone) profileData.phone = trimmedPhone;
                if (trimmedAddress) profileData.address = trimmedAddress;

                const response = await updateProfile(profileData).unwrap();
                const updatedData =
                  response && typeof response === "object" && "data" in response
                    ? (response as { data?: Partial<AuthUser> }).data
                    : undefined;

                const nextPartial: Partial<AuthUser> = {};
                if (updatedData?.firstName !== undefined) {
                  nextPartial.firstName = updatedData.firstName ?? null;
                }
                if (updatedData?.lastName !== undefined) {
                  nextPartial.lastName = updatedData.lastName ?? null;
                }
                if (updatedData?.phone !== undefined) {
                  nextPartial.phone = updatedData.phone ?? null;
                }
                if (updatedData?.address !== undefined) {
                  nextPartial.address = updatedData.address ?? null;
                }

                if (Object.keys(nextPartial).length > 0) {
                  updateUser(nextPartial);
                }
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
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Profile photo</label>
              <ImageUpload
                key={user?.avatarUrl || user?.avatar || 'no-avatar'}
                value={avatarPreview ?? undefined}
                onChange={handleProfileImageChange}
                onRemove={() => handleProfileImageChange(null)}
              />
              {profileFile ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      try {
                        const avatarFormData = new FormData();
                        avatarFormData.append("file", profileFile);
                        const avatarResponse = await uploadAvatar(avatarFormData).unwrap();
                        
                        // Clean up object URL first
                        if (objectUrlRef.current) {
                          URL.revokeObjectURL(objectUrlRef.current);
                          objectUrlRef.current = null;
                        }
                        
                        // Extract avatarUrl from response
                        // Response can be: { success: true, data: { avatarUrl: "..." } } or { avatarUrl: "..." } directly
                        let newAvatarUrl: string | null | undefined;
                        if (avatarResponse && typeof avatarResponse === "object") {
                          // Check if response has a data wrapper
                          if ("data" in avatarResponse && avatarResponse.data) {
                            const data = avatarResponse.data as Partial<AuthUser>;
                            newAvatarUrl = (data.avatarUrl ?? data.avatar) || undefined;
                          } 
                          // Check if avatarUrl is directly in the response
                          else if ("avatarUrl" in avatarResponse) {
                            newAvatarUrl = (avatarResponse as Partial<AuthUser>).avatarUrl || undefined;
                          }
                        }
                        
                        if (newAvatarUrl) {
                          // Resolve the URL first
                          const resolvedUrl = resolveProfileUrl(newAvatarUrl);
                          console.log('[Avatar Upload] Full response:', JSON.stringify(avatarResponse, null, 2));
                          console.log('[Avatar Upload] Extracted avatarUrl:', newAvatarUrl);
                          console.log('[Avatar Upload] Resolved URL:', resolvedUrl);
                          
                          // Update user state immediately
                          updateUser({ avatarUrl: newAvatarUrl, avatar: newAvatarUrl });
                          
                          // Update preview with resolved URL immediately
                          setAvatarPreview(resolvedUrl || null);
                        } else {
                          console.warn('[Avatar Upload] No avatarUrl found in response:', JSON.stringify(avatarResponse, null, 2));
                        }
                        
                        // Clear the file selection after successful upload
                        setProfileFile(null);
                        toast.success("Avatar uploaded successfully");
                      } catch (err) {
                        const message =
                          (err as { data?: { message?: string | string[] } })?.data?.message ??
                          "Failed to upload avatar";
                        toast.error(Array.isArray(message) ? message.join(", ") : String(message));
                      }
                    }}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? "Uploading…" : "Upload Avatar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleProfileImageChange(null);
                      setProfileFile(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
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
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge variant="secondary" className="capitalize">
                  {user?.role ? user.role.replace(/_/g, " ").toLowerCase() : "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Login</dt>
              <dd className="font-medium">
                {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
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
                if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
                  setPasswordError("Password must be at least 8 characters");
                  return;
                }
                if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
                  setPasswordError("New passwords do not match");
                  return;
                }
                try {
                  await changePassword({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmNewPassword: passwordForm.confirmNewPassword,
                  }).unwrap();
                  toast.success("Password updated");
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
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
                    value={passwordForm.confirmNewPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, confirmNewPassword: event.target.value }))
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


