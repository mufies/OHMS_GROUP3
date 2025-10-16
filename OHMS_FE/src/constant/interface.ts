export interface ProfileData {
  id: string;
  username: string;
  imageUrl?: string;
  email: string;
  roles: Array<{
    name: string;
    description?: string;
    permissions: string[];
  }>;
  phone?: string | null;
  medicleSpecially?: string | null;
}