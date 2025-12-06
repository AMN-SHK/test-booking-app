export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  role: 'user' | 'admin';
}

// user data to send back (without password)
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserDTO;
    token: string;
  };
}

