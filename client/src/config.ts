export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Helper to determine if we are in production
export const IS_PROD = process.env.NODE_ENV === "production";
