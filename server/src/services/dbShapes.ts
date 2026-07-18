import type { Prisma } from "../generated/prisma/client.js";

export const userPublicSelect = {
  id: true,
  username: true,
  avatar: true,
  banner: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const userOwnSelect = {
  ...userPublicSelect,
  email: true,
} satisfies Prisma.UserSelect;

export const messageInclude = {
  sender: {
    select: userPublicSelect,
  },
  receiver: {
    select: userPublicSelect,
  },
} satisfies Prisma.MessageInclude;
