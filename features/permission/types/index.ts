export interface Permission {
  id: string;
  code: string;
  description?: string | null;
}

// Payload for setting permissions of a user
export interface UserPermissionsDto {
  codes: string[];
}


