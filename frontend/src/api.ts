import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});


// Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
    (error) => {
    // Only redirect if it's a 401 and we aren't ALREADY trying to check our session
    if (error.response?.status === 401 && error.config.url !== '/auth/me') {
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
    });

export default api;