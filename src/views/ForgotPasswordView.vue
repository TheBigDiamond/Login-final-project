<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <h1>Accenture</h1>
      </div>
      <h2>Reset Your Password</h2>
      <p class="subtitle">
        Enter your email and we'll send you a link to reset your password
      </p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div
          v-if="message"
          :class="['message', { success: isSuccess, error: !isSuccess }]"
        >
          {{ message }}
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="email"
            :class="{ invalid: emailError }"
            @input="emailError = false"
            placeholder="Enter your email address"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading">Sending Reset Link...</span>
          <span v-else>Send Reset Link</span>
        </button>
      </form>

      <div class="back-to-login">
        <router-link to="/login"> &larr; Back to Login </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const loading = ref(false);
const message = ref("");
const isSuccess = ref(false);
const emailError = ref(false);
const formSubmitted = ref(false);

const validateForm = () => {
  formSubmitted.value = true;
  let isValid = true;

  if (!email.value) {
    emailError.value = true;
    message.value = "Email is required";
    isSuccess.value = false;
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = true;
    message.value = "Please enter a valid email address";
    isSuccess.value = false;
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  message.value = "";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    isSuccess.value = true;
    message.value =
      "If an account exists with this email, you will receive a password reset link shortly.";

    email.value = "";

    setTimeout(() => {
      router.push("/login");
    }, 5000);
  } catch (error) {
    isSuccess.value = false;
    message.value = "An error occurred. Please try again later.";
    console.error("Password reset error:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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

.form-group input:not(.invalid):not(:focus) {
  border-color: #ccc;
}

.message {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  text-align: left;
}

.message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.message.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.back-to-login {
  margin-top: 20px;
  text-align: center;
}

.back-to-login a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s;
}

.back-to-login a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
