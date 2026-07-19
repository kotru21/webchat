export interface PublicUser {
  _id: string;
  username: string;
  avatar: string;
  banner: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnUser extends PublicUser {
  email: string;
}

/** @deprecated Prefer PublicUser / OwnUser */
export type SafeUser = OwnUser;

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

export interface JwtPayload {
  id: string;
  /** Refresh session family id — binds access JWT to a device session. */
  sid: string;
  iat?: number;
  exp?: number;
}
