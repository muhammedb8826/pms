// Backend API base URL
// Defaults to /api (without version) per backend documentation
// If your backend uses /api/v1, set NEXT_PUBLIC_API_URL in .env.local
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.qenenia.com/api';

