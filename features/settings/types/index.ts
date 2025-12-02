export interface PharmacySettings {
  id: string;
  pharmacyName: string;
  pharmacyLogoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdatePharmacySettingsDto = Partial<
  Pick<
    PharmacySettings,
    'pharmacyName' | 'pharmacyLogoUrl' | 'address' | 'phone' | 'email'
  >
>;


