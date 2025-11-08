"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/user/components/UserForm';
import { useUser } from '@/features/user/hooks/useUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function resolveProfileUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    try {
      const url = new URL(base);
      return `${url.origin}${path.startsWith('/') ? path : `/${path}`}`;
    } catch {
      // fall through
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user, isLoading, error, refetch } = useUser(userId);

  const displayName = useMemo(() => {
    if (!user) return '';
    const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return full || user.email || 'User';
  }, [user]);

  useEffect(() => {
    if (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to load user');
    }
  }, [error]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg">
            {user?.profile ? (
              <AvatarImage src={resolveProfileUrl(user.profile)} alt={displayName} />
            ) : (
              <AvatarFallback className="rounded-lg font-semibold">
                {displayName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'US'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{displayName || 'Edit User'}</h1>
            <p className="text-sm text-muted-foreground">
              Update user details, roles, and account status.
            </p>
            {user?.roles?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isSubmitting}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading user details…</div>
        ) : user ? (
          <>
            {formError ? (
              <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            <UserForm
              user={user}
              onSuccess={() => {
                router.push('/users');
                router.refresh();
              }}
              onCancel={() => router.back()}
              onErrorChange={setFormError}
              onSubmittingChange={setIsSubmitting}
            />
          </>
        ) : (
          <div className="space-y-4 py-10 text-center text-sm text-muted-foreground">
            <p>User not found.</p>
            <Button variant="outline" onClick={() => router.push('/users')}>
              Back to users
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


