const isProd = process.env.NODE_ENV === 'production';

// Get the raw URL from environment
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || (isProd ? '/api' : 'http://localhost:5001/api');

// ensure API_URL ends with /api if it's a full URL and doesn't have it
// This makes it work with "https://jps-test.onrender.com" directly
export const API_URL = rawApiUrl.startsWith('http') && !rawApiUrl.endsWith('/api')
    ? `${rawApiUrl}/api`
    : rawApiUrl;

export const IS_PROD = isProd;
