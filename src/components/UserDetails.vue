<template>
  <div class="user-details">
    <h2>My Profile</h2>

    <div v-if="loading" class="loading">Loading user data...</div>

    <form v-else @submit.prevent="updateProfile" class="profile-form">
      <div class="form-group">
        <label for="name">Full Name</label>
        <input
          type="text"
          id="name"
          v-model="formData.name"
          required
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="formData.email"
          required
          class="form-control"
          disabled
        />
        <small class="text-muted">Email cannot be changed</small>
      </div>

      <div class="form-group">
        <label for="currentPassword"
          >Current Password (required to change password)</label
        >
        <input
          type="password"
          id="currentPassword"
          v-model="formData.currentPassword"
          :class="['form-control', { 'is-invalid': currentPasswordError }]"
          @input="currentPasswordError = false"
          :required="!!formData.newPassword"
        />
        <div v-if="currentPasswordError" class="invalid-feedback">
          {{ currentPasswordError }}
        </div>
      </div>

      <div class="form-group">
        <label for="newPassword"
          >New Password (leave blank to keep current)</label
        >
        <input
          type="password"
          id="newPassword"
          v-model="formData.newPassword"
          :class="['form-control', { 'is-invalid': newPasswordError }]"
          @input="newPasswordError = false"
          :minlength="formData.newPassword ? 6 : 0"
        />
        <div v-if="newPasswordError" class="invalid-feedback">
          {{ newPasswordError }}
        </div>
        <small v-if="formData.newPassword" class="form-text text-muted">
          Password must be at least 6 characters and include letters, numbers,
          and special characters
        </small>
      </div>

      <div class="form-group" v-if="formData.newPassword">
        <label for="confirmPassword">Confirm New Password</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          :class="['form-control', { 'is-invalid': confirmPasswordError }]"
          @input="confirmPasswordError = ''"
          :required="!!formData.newPassword"
        />
        <div v-if="confirmPasswordError" class="invalid-feedback">
          {{ confirmPasswordError }}
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn btn-primary">
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>
        <button
          type="button"
          @click="resetForm"
          class="btn btn-secondary"
          :disabled="saving"
        >
          Reset
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const currentPasswordError = ref("");
const newPasswordError = ref("");
const confirmPasswordError = ref("");
const confirmPassword = ref("");

const formData = ref({
  name: "",
  email: "",
  currentPassword: "",
  newPassword: "",
});

// Ensure the object is reactive
const initFormData = () => {
  formData.value = {
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  };
};

const originalData = ref({});

onMounted(async () => {
  try {
    loading.value = true;
    error.value = "";

    console.log("Loading user data...");

    await authStore.fetchUser();

    if (!authStore.user) {
      throw new Error("No user data available");
    }

    console.log("User data loaded:", authStore.user);

    formData.value = {
      name: authStore.user?.name || "",
      email: authStore.user?.email || "",
      currentPassword: "",
      newPassword: "",
    };

    // Save original data for reset functionality
    originalData.value = { ...formData.value };
  } catch (err) {
    console.error("Error in UserDetails onMounted:", err);

    if (
      err.message.includes("401") ||
      err.message.includes("Not authenticated")
    ) {
      error.value = "Your session has expired. Please log in again.";
      authStore.logout();
    } else if (err.message.includes("NetworkError")) {
      error.value =
        "Unable to connect to the server. Please check your internet connection.";
    } else {
      error.value = "Failed to load user data. Please try again later.";
    }
  } finally {
    loading.value = false;
  }
});

const resetForm = () => {
  if (Object.keys(originalData.value).length > 0) {
    formData.value = { ...originalData.value };
  } else {
    initFormData();
  }
  error.value = "";
};

const validatePassword = (password) => {
  if (!password) return true; // Empty password is allowed (means keep current)

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+/.test(password);

  if (!(hasLetter && hasNumber && hasSpecialChar)) {
    return "Password must include letters, numbers, and special characters";
  }

  return "";
};

const updateProfile = async () => {
  try {
    saving.value = true;
    error.value = "";
    currentPasswordError.value = "";
    newPasswordError.value = "";
    confirmPasswordError.value = "";

    if (formData.value.newPassword) {
      if (!formData.value.currentPassword) {
        currentPasswordError.value =
          "Current password is required to change your password";
        return;
      }

      const passwordError = validatePassword(formData.value.newPassword);
      if (passwordError) {
        newPasswordError.value = passwordError;
        return;
      }

      if (formData.value.newPassword !== confirmPassword.value) {
        confirmPasswordError.value = "Passwords do not match";
        return;
      }
    }

    const updateData = {
      name: formData.value.name,
    };

    if (formData.value.currentPassword && formData.value.newPassword) {
      updateData.currentPassword = formData.value.currentPassword;
      updateData.newPassword = formData.value.newPassword;
    }

    await authStore.updateProfile(updateData);

    originalData.value = { ...formData.value };

    formData.value.currentPassword = "";
    formData.value.newPassword = "";

    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Error updating profile:", err);
    error.value = err.message || "Failed to update profile. Please try again.";
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.user-details {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-control:focus {
  border-color: #a100ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(161, 0, 255, 0.2);
}

.text-muted {
  color: #666;
  font-size: 0.875rem;
  display: block;
  margin-top: 0.25rem;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #a100ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #8a00e6;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
