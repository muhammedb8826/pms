"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { USER_GENDERS, USER_ROLES, User, UserGender, UserRole } from '@/features/user/types';
import { useCreateUser, useUpdateUser } from '@/features/user/hooks/useUsers';
import { handleApiError, handleApiSuccess } from '@/lib/utils/api-error-handler';

const phoneRegex = /^\+?\d{7,20}$/;

const baseSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').transform((val) => val.toLowerCase()),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(USER_GENDERS).optional(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid phone number (7-20 digits, optional + prefix)'),
  address: z.string().optional(),
  roles: z.array(z.enum(USER_ROLES)).min(1, 'Select at least one role'),
  isActive: z.boolean(),
});

const createSchema = baseSchema
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

const updateSchema = baseSchema
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const hasPassword = data.password && data.password.length > 0;
    const hasConfirm = data.confirmPassword && data.confirmPassword.length > 0;
    if (hasPassword && !hasConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Confirm password is required when changing password',
      });
    }
    if (hasConfirm && !hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password is required when confirming password',
      });
    }
    if (hasPassword && hasConfirm && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  onErrorChange?: (msg: string | null) => void;
  onSubmittingChange?: (loading: boolean) => void;
}

type FormErrors = Partial<Record<keyof z.infer<typeof createSchema> | 'form', string>>;

const getInitialRoles = (user?: User | null): UserRole[] => {
  if (user?.roles && user.roles.length > 0) return user.roles;
  return ['USER'];
};

export function UserForm({
  user,
  onSuccess,
  onCancel,
  formId,
  hideActions,
  onErrorChange,
  onSubmittingChange,
}: UserFormProps) {
  const [email, setEmail] = useState(user?.email ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [middleName, setMiddleName] = useState(user?.middleName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [gender, setGender] = useState<UserGender | ''>(user?.gender ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [roles, setRoles] = useState<UserRole[]>(getInitialRoles(user));
  const [isActive, setIsActive] = useState<boolean>(user?.isActive ?? true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profile ?? null);
  const [errors, setErrors] = useState<FormErrors>({});

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? '');
      setFirstName(user.firstName ?? '');
      setMiddleName(user.middleName ?? '');
      setLastName(user.lastName ?? '');
      setGender(user.gender ?? '');
      setPhone(user.phone ?? '');
      setAddress(user.address ?? '');
      setRoles(getInitialRoles(user));
      setIsActive(user.isActive ?? true);
      setProfilePreview(user.profile ?? null);
      setProfileFile(null);
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      onErrorChange?.(null);
    }
  }, [user, onErrorChange]);

  const schema = useMemo(() => (user ? updateSchema : createSchema), [user]);

  const toggleRole = (role: UserRole, checked: boolean) => {
    setRoles((prev) => {
      if (checked) {
        if (prev.includes(role)) return prev;
        return [...prev, role];
      }
      return prev.filter((item) => item !== role);
    });
  };

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, form: 'Only image files are allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, form: 'Image must be less than 5 MB' }));
      return;
    }
    setProfileFile(file);
    setErrors((prev) => ({ ...prev, form: undefined }));
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const buildFormData = (data: Record<string, unknown>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0)
      ) {
        return;
      }
      if (key === 'roles' && Array.isArray(value)) {
        if (value.length === 0) return;
        value.forEach((role) => formData.append('roles[]', role));
        return;
      }
      if (key === 'isActive' && typeof value === 'boolean') {
        formData.append('isActive', value ? 'true' : 'false');
        return;
      }
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      formData.append(key, String(value));
    });
    return formData;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    onErrorChange?.(null);

    const parsed = schema.safeParse({
      email,
      firstName,
      middleName: middleName || undefined,
      lastName: lastName || undefined,
      gender: gender || undefined,
      phone,
      address: address || undefined,
      roles,
      isActive,
      password: user ? password : undefined,
      confirmPassword: user ? confirmPassword : undefined,
      ...(user ? {} : { password, confirmPassword }),
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const pathKey = issue.path?.[0] as keyof FormErrors;
        if (pathKey) {
          fieldErrors[pathKey] = issue.message;
        }
      });
      setErrors(fieldErrors);
      onErrorChange?.('Please fix the highlighted errors.');
      return;
    }

    const payload: Record<string, unknown> = {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName,
      lastName: parsed.data.lastName,
      gender: parsed.data.gender,
      phone: parsed.data.phone,
      address: parsed.data.address,
      roles: parsed.data.roles,
      isActive: parsed.data.isActive,
    };

    if (!user) {
      payload.password = (parsed.data as z.infer<typeof createSchema>).password;
      payload.confirmPassword = (parsed.data as z.infer<typeof createSchema>).confirmPassword;
    } else if (password && password.length > 0) {
      payload.password = password;
      payload.confirmPassword = confirmPassword;
    }

    if (profileFile) {
      payload.profile = profileFile;
    }

    try {
      if (user) {
        const formData = buildFormData(payload);
        await updateMutation.mutateAsync({ id: user.id, data: formData });
        handleApiSuccess('User updated successfully');
      } else {
        const formData = buildFormData(payload);
        await createMutation.mutateAsync(formData);
        handleApiSuccess('User created successfully');
        setPassword('');
        setConfirmPassword('');
        setProfileFile(null);
        setProfilePreview(null);
        setRoles(getInitialRoles());
        setIsActive(true);
      }
      onSuccess();
    } catch (err) {
      const message = handleApiError(err, {
        defaultMessage: 'Failed to save user',
      });
      setErrors((prev) => ({ ...prev, form: message }));
      onErrorChange?.(message);
    }
  }

  const displayName = `${firstName} ${lastName ?? ''}`.trim() || email || 'User';
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</div>}

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-lg">
          {profilePreview ? (
            <AvatarImage src={profilePreview} alt={displayName} />
          ) : (
            <AvatarFallback className="rounded-lg text-base">{initials || 'US'}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Profile photo</Label>
          <Input type="file" accept="image/*" onChange={handleProfileChange} />
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF, BMP, SVG up to 5 MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="firstName">First name *</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-invalid={Boolean(errors.firstName)} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName ?? ''} onChange={(e) => setLastName(e.target.value)} aria-invalid={Boolean(errors.lastName)} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="middleName">Middle name</Label>
          <Input id="middleName" value={middleName ?? ''} onChange={(e) => setMiddleName(e.target.value)} aria-invalid={Boolean(errors.middleName)} />
          {errors.middleName && <p className="text-xs text-destructive">{errors.middleName}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender || ''} onValueChange={(value) => setGender(value as UserGender)} >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {USER_GENDERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
        </div>
      </div>

      {!user && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm password *</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={Boolean(errors.confirmPassword)} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={Boolean(errors.confirmPassword)} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          rows={3}
          value={address ?? ''}
          onChange={(e) => setAddress(e.target.value)}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

  <div className="space-y-2">
    <Label>Roles *</Label>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {USER_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <Checkbox
            checked={roles.includes(role)}
            onCheckedChange={(checked) => toggleRole(role, Boolean(checked))}
          />
          <span className="capitalize">{role.replace(/_/g, ' ').toLowerCase()}</span>
        </label>
      ))}
    </div>
    {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}
  </div>

      <div className="flex items-center gap-2">
        <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(Boolean(checked))} />
        <label htmlFor="isActive" className="text-sm">Active</label>
      </div>

      {hideActions ? null : (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      )}
    </form>
  );
}


