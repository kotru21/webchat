import type { Prisma } from "../generated/prisma/client.js";

export const userPublicSelect = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  banner: true,
  description: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const messageInclude = {
  sender: {
    select: userPublicSelect,
  },
  receiver: {
    select: userPublicSelect,
  },
  readBy: {
    include: {
      user: {
        select: userPublicSelect,
      },
    },
  },
} satisfies Prisma.MessageInclude;
