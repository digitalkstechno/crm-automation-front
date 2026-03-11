import { api } from "./axiosInstance";
import { baseUrl } from "../../config";

let cachedUserData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getUserData = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && cachedUserData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUserData;
  }
  
  try {
    const response = await api.get(baseUrl.STAFF + "/me");
    cachedUserData = response.data.data;
    cacheTimestamp = now;
    return cachedUserData;
  } catch (error) {
    console.error("Failed to fetch user data", error);
    return null;
  }
};

export const clearUserCache = () => {
  cachedUserData = null;
  cacheTimestamp = 0;
};

// For backward compatibility
export const getTokenData = getUserData;
