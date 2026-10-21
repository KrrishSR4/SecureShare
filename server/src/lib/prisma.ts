// Re-export the configured Turso Prisma client from the central config
// This ensures all parts of the app use the same LibSQL-adapted client
export { default } from "../config/postgres.js";
