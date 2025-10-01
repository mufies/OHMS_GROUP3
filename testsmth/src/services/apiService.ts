const API_BASE_URL = 'http://localhost:8080';

// ApiResponse interface
export interface ApiResponse<T> {
  code: number;
  message?: string;
  results: T;
}

// Authentication interfaces
export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  authenticated: boolean;
  token: string;
}

// User interfaces
export interface UserRequest {
  username: string;
  password: string;
  email: string;
  roles: string[];
  phone?: number;
  medicleSpecially?: MedicalSpecialty[];
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  imageUrl?: string;
  roles: RoleResponse[];
  phone?: number;
  medicleSpecially?: MedicalSpecialty[];
}

export interface RoleResponse {
  name: string;
  description: string;
  permissions: PermissionResponse[];
}

export interface PermissionResponse {
  name: string;
  description: string;
}

export const MedicalSpecialty = {
  INTERNAL_MEDICINE: 'INTERNAL_MEDICINE', // Nội khoa
  SURGERY: 'SURGERY',                     // Ngoại khoa
  CARDIOLOGY: 'CARDIOLOGY',               // Tim mạch
  PEDIATRICS: 'PEDIATRICS',               // Nhi khoa
  DERMATOLOGY: 'DERMATOLOGY'              // Da liễu
} as const;

export type MedicalSpecialty = typeof MedicalSpecialty[keyof typeof MedicalSpecialty];

export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

class ApiService {
  private baseUrl: string = API_BASE_URL;

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw {
          code: response.status,
          message: errorData.message || `HTTP ${response.status}`,
          details: errorData.details
        } as ApiError;
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          code: 0,
          message: 'Network error - Please check if the server is running',
          details: 'Cannot connect to the backend server'
        } as ApiError;
      }
      throw error;
    }
  }

  // Helper method for multipart/form-data requests
  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // no Content-Type header so browser will set boundary for multipart/form-data
    const defaultHeaders: Record<string, string> = {};
    
    // Add authorization header if token exists
    const token = this.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: 'POST',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw {
          code: response.status,
          message: errorData.message || `HTTP ${response.status}`,
          details: errorData.details
        } as ApiError;
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          code: 0,
          message: 'Network error - Please check if the server is running',
          details: 'Cannot connect to the backend server'
        } as ApiError;
      }
      throw error;
    }
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  // Authentication methods
  async login(credentials: AuthenticationRequest): Promise<ApiResponse<AuthenticationResponse>> {
    const response = await this.request<AuthenticationResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token if login successful
    if (response.results.authenticated && response.results.token) {
      this.setToken(response.results.token);
    }

    return response;
  }

  async register(
    userData: UserRequest, 
    avatar?: File
  ): Promise<ApiResponse<UserResponse>> {
    const formData = new FormData();
    
    formData.append('username', userData.username);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    // Send roles as JSON string array (matching your example)
    formData.append('roles', JSON.stringify(userData.roles));

    // Add optional fields
    if (userData.phone) {
      formData.append('phone', userData.phone.toString());
    }

    if (userData.medicleSpecially && userData.medicleSpecially.length > 0) {
      userData.medicleSpecially.forEach(specialty => {
        formData.append('medicleSpecially', specialty);
      });
    }

    if (avatar) {
      formData.append('avatar', avatar);
    }
  
    return await this.requestFormData<UserResponse>('/users/register', formData);
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await this.request<UserResponse>('/users/getinfo');
    return response.results;
  }

  async introspectToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    return await this.request<{ valid: boolean }>('/auth/introspect', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getDoctors(): Promise<ApiResponse<UserResponse[]>> {
    return await this.request<UserResponse[]>('/users/getListDoctor');
  }

  logout(): void {
    this.removeToken();
  }
}

export const apiService = new ApiService();

// Utility functions for medical specialties
export const getMedicalSpecialtyLabel = (specialty: MedicalSpecialty): string => {
  const labels = {
    [MedicalSpecialty.INTERNAL_MEDICINE]: 'Internal Medicine',
    [MedicalSpecialty.SURGERY]: 'Surgery',
    [MedicalSpecialty.CARDIOLOGY]: 'Cardiology',
    [MedicalSpecialty.PEDIATRICS]: 'Pediatrics',
    [MedicalSpecialty.DERMATOLOGY]: 'Dermatology',
  };
  return labels[specialty] || specialty;
};

export const getMedicalSpecialtyOptions = () => {
  return Object.values(MedicalSpecialty).map(specialty => ({
    value: specialty,
    label: getMedicalSpecialtyLabel(specialty)
  }));
};
