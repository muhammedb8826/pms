"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconCheck, IconKey, IconSearch } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/features/user/hooks/useUsers";
import { usePermissions, useSetUserPermissions, useUserPermissions } from "@/features/permission/hooks/usePermissions";
import type { Permission } from "@/features/permission/types";
import { handleApiError, handleApiSuccess } from "@/lib/utils/api-error-handler";

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  permissions.forEach((perm) => {
    const [prefix] = perm.code.split(".");
    const groupKey = prefix || "other";
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(perm);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function UserPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const { data: user, isLoading: userLoading } = useUser(userId || null);
  const { permissions, isLoading: permsLoading } = usePermissions();
  const { codes: userCodes, isLoading: userPermsLoading, refetch: refetchUserPerms } = useUserPermissions(userId || undefined);
  const setUserPermissions = useSetUserPermissions();

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const next = userCodes ?? [];
    setSelected((prev) => {
      if (prev.length === next.length && prev.every((c, i) => c === next[i])) {
        return prev;
      }
      return next;
    });
  }, [userCodes]);

  const grouped = useMemo(() => {
    const filtered = permissions.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
    return groupPermissions(filtered);
  }, [permissions, search]);

  const toggleCode = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSelectAll = () => {
    setSelected(permissions.map((p) => p.code));
  };

  const handleClearAll = () => {
    setSelected([]);
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      await setUserPermissions.mutateAsync(userId, selected);
      handleApiSuccess("Permissions updated");
      await refetchUserPerms();
      router.back();
    } catch (err) {
      handleApiError(err, { defaultMessage: "Failed to update permissions" });
    }
  };

  const loading = userLoading || permsLoading || userPermsLoading || setUserPermissions.isLoading;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-1"
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <IconKey className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Manage Permissions</h1>
          </div>
          {user && (
            <p className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName ?? ""} ({user.email})
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <IconSearch className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={permissions.length === 0}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>
        </div>

        <Separator />

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading permissions...
          </div>
        ) : permissions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No permissions defined on the server.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {grouped.map(([group, perms]) => (
              <div
                key={group}
                className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      {group}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {perms.length} permission{perms.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="mt-1 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {perms.map((perm) => {
                    const checked = selected.includes(perm.code);
                    return (
                      <button
                        key={perm.id ?? perm.code}
                        type="button"
                        onClick={() => toggleCode(perm.code)}
                        className={`flex w-full items-start justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px]">{perm.code}</span>
                          {perm.description && (
                            <span className="mt-0.5 text-[11px] text-muted-foreground">
                              {perm.description}
                            </span>
                          )}
                        </div>
                        {checked && (
                          <IconCheck className="ml-2 mt-0.5 size-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !userId}
          >
            {setUserPermissions.isLoading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}


