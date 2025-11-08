"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/user/components/UserForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function NewUserPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultRoles = useMemo(() => ['USER'], []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarFallback className="rounded-lg font-semibold">NU</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">Create User</h1>
            <p className="text-sm text-muted-foreground">
              Add a new user account, assign roles, and set their initial access.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {defaultRoles.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Back
        </Button>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        {formError ? (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}
        <UserForm
          onSuccess={() => {
            router.push('/users');
            router.refresh();
          }}
          onCancel={() => router.back()}
          onErrorChange={setFormError}
          onSubmittingChange={setIsSubmitting}
        />
      </div>
    </div>
  );
}


