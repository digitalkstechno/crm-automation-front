import axios from "axios";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically for all requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          isRefreshing = false;
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/refresh-token`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data;
          
          if (!token || !newRefreshToken) {
            throw new Error("Invalid refresh token response");
          }
          
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", newRefreshToken);

          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;

          processQueue(null, token);
          isRefreshing = false;

          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          isRefreshing = false;
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }
    }

    return Promise.reject(error);
  }
);
