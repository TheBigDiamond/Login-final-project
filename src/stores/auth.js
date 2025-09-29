import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();
  const user = ref(JSON.parse(localStorage.getItem("user")) || null);
  const token = ref(localStorage.getItem("token") || null);
  const loading = ref(false);
  const error = ref(null);
  const returnUrl = ref(null);

  const isAuthenticated = computed(() => !!user.value);
  const userFullName = computed(() =>
    user.value ? `${user.value.name || ""}`.trim() : ""
  );

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  });
  const apiRequest = async (url, options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (err) {
      error.value = err.message || "An error occurred";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  async function login(email, password, redirectUrl = null) {
    try {
      const response = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Update pinia state
      user.value = response.user;
      token.value = response.token;

      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.token);

      const route = router.currentRoute.value;
      const redirectFromQuery = route.query.redirect;
      const redirectTo =
        redirectUrl || redirectFromQuery || returnUrl.value || "/";

      returnUrl.value = null;

      router.push(redirectTo);
      return response.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async function register(registrationData) {
    try {
      const { firstName, lastName, email, password } = registrationData;
      const name = `${firstName} ${lastName}`.trim();
      const registrationPayload = {
        name: name.trim(),
        email: email.trim(),
        password: password,
      };

      console.log("Attempting to register user:", { email, name });

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed");
      }

      const responseData = await response.json();
      console.log("Registration successful:", responseData);

      const userData = responseData.user || responseData;
      const authToken = responseData.token || responseData.access_token;

      if (!userData || !authToken) {
        console.error("Invalid response format:", responseData);
        throw new Error("Invalid server response format");
      }

      const cleanUser = {
        id: userData.id || Date.now().toString(),
        name: userData.name || name,
        email: userData.email || email,
      };

      // Update Pinia state
      user.value = cleanUser;
      token.value = authToken;

      localStorage.setItem("user", JSON.stringify(cleanUser));
      localStorage.setItem("token", authToken);

      const redirectPath = returnUrl.value || "/";
      returnUrl.value = null;
      router.push(redirectPath);

      return cleanUser;
    } catch (error) {
      console.error("Registration failed:", error);

      try {
        if (error.message) {
          const errorData = JSON.parse(error.message);
          throw new Error(errorData.message || "Registration failed");
        }
      } catch (e) {
        throw new Error(error.message || "Registration failed");
      }

      throw error;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  }

  async function fetchUser() {
    try {
      if (!token.value) {
        console.error("No authentication token found");
        throw new Error("Not authenticated");
      }

      console.log("Fetching user data with token:", token.value);

      const response = await apiRequest("/auth/me");

      if (!response) {
        console.error("No response received from /auth/me");
        throw new Error("No response from server");
      }

      console.log("Fetched user data:", response);

      let userData = response.user || response;

      if (
        !userData ||
        (typeof userData === "object" && Object.keys(userData).length === 0)
      ) {
        console.error("Invalid user data received:", response);
        throw new Error("Invalid user data received from server");
      }

      // Ensure we have required user fields
      if (!userData.id) {
        userData = {
          id: response.id || Date.now().toString(),
          email: response.email,
          name: response.name,
        };
      }

      user.value = userData;
      localStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Error in fetchUser:", error);

      if (error.message.includes("401") || error.message.includes("403")) {
        console.log("Clearing invalid token");
        token.value = null;
        localStorage.removeItem("token");
      }
      throw error;
    }
  }

  async function updateProfile(updateData) {
    try {
      console.log("Updating profile with data:", updateData);

      // Create a copy of updateData to avoid modifying the original
      const dataToSend = { ...updateData };

      const response = await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify(dataToSend),
      });

      console.log("Profile update response:", response);

      const userData = response.user || response;

      if (!userData) {
        throw new Error("No user data received after update");
      }

      user.value = { ...user.value, ...userData };
      localStorage.setItem("user", JSON.stringify(user.value));

      return userData;
    } catch (error) {
      console.error("Error updating profile:", error);

      let errorMessage = error.message;
      const responseData = error.response?.data || {};

      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      } else if (typeof responseData === "string") {
        errorMessage = responseData;
      }

      console.log("Extracted error message:", errorMessage);

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Invalid credentials") ||
        errorMessage.includes("Current password is incorrect")
      ) {
        throw new Error("The current password you entered is incorrect");
      } else if (
        errorMessage.includes("400") ||
        errorMessage.includes("validation")
      ) {
        throw new Error("Please check your input and try again");
      } else {
        console.error("Unexpected error format:", error);
        throw new Error("Failed to update profile. Please try again later.");
      }
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    token,
    loading,
    error,
    returnUrl,

    isAuthenticated,
    userFullName,

    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    clearError,

    apiRequest,
  };
});
