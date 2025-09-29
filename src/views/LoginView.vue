<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <h1>Accenture</h1>
      </div>
      <h2>Welcome Back</h2>
      <p class="subtitle">Sign in to your account</p>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            :class="{ invalid: emailError }"
            @input="emailError = false"
            required
          />
        </div>

        <div class="form-group">
          <div class="password-header">
            <label for="password">Password</label>
            <router-link to="/forgot-password" class="forgot-password"
              >Forgot password?</router-link
            >
          </div>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              type="password"
              :class="{ invalid: passwordError }"
              @input="passwordError = false"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>

        <div class="remember-me">
          <input type="checkbox" id="remember" v-model="rememberMe" />
          <label for="remember">Remember me</label>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="signup-link">
        Don't have an account? <router-link to="/register">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const loading = ref(false);
const loginError = ref("");
const emailError = ref(false);
const passwordError = ref(false);
const error = ref("");

if (route.query.redirect) {
  authStore.returnUrl = route.query.redirect;
}

const validateForm = () => {
  let isValid = true;
  emailError.value = false;
  passwordError.value = false;
  loginError.value = "";

  if (!email.value) {
    emailError.value = true;
    loginError.value = "Email is required";
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = true;
    loginError.value = "Please enter a valid email address";
    isValid = false;
  }

  if (!password.value) {
    passwordError.value = true;
    if (!loginError.value) loginError.value = "Password is required";
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  loginError.value = "";

  try {
    await authStore.login(email.value, password.value);
  } catch (error) {
    console.error("Login failed:", error);
    loginError.value = "Invalid email or password";
    emailError.value = true;
    passwordError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  text-align: left;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input.invalid {
  border-color: var(--error-color);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
