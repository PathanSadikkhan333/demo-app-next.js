import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Extend the globalThis type to include prismaGlobal client instance
declare const globalThis: {
  prismaGlobal?: PrismaClient;
} & typeof global;

// Create or reuse the PrismaClient instance (singleton)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// In development, attach prisma to globalThis to preserve the client across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
