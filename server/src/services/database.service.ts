import prisma from "../config/postgres.js";

export const DatabaseService = {
  getPrisma() {
    return prisma;
  },

  async isAlive(): Promise<boolean> {
    try {
      await prisma.$executeRawUnsafe("SELECT 1;");
      return true;
    } catch {
      return false;
    }
  },
};
