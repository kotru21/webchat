export type SafeUser = {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  banner: string;
  description: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  avatar: string;
};

export type JwtPayload = {
  id: string;
  iat?: number;
  exp?: number;
};
