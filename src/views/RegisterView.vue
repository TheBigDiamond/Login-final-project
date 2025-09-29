<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <h1>Accenture</h1>
      </div>
      <h2>Create an Account</h2>
      <p class="subtitle">Join us today!</p>
      <form @submit.prevent="handleSubmit">
        <div v-if="formError" class="error-message">
          {{ formError }}
        </div>

        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            v-model="firstName"
            :class="{ invalid: firstNameError }"
            @input="firstNameError = false"
            placeholder="Enter your first name"
            required
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            v-model="lastName"
            type="text"
            :class="{ invalid: lastNameError }"
            @input="lastNameError = false"
            placeholder="Enter your last name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :class="{ invalid: emailError }"
            @input="emailError = false"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              type="password"
              :class="{ invalid: passwordError }"
              @input="passwordError = false"
              placeholder="Create a password"
              required
            />
          </div>
          <p class="hint">
            Use 6 or more characters with a mix of letters, numbers & symbols
          </p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="password-input">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              :class="{ invalid: confirmPasswordError }"
              @input="confirmPasswordError = false"
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <div class="terms">
            <input
              type="checkbox"
              id="terms"
              v-model="acceptedTerms"
              :class="{ invalid: termsError }"
              @change="termsError = false"
            />
            <label for="terms"
              >I agree to the
              <a href="#" @click.prevent="showTerms = true">Terms of Service</a>
              and
              <a href="#" @click.prevent="showPrivacy = true"
                >Privacy Policy</a
              ></label
            >
            <p v-if="termsError" class="error-message">
              You must accept the terms and conditions
            </p>
          </div>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading">Creating Account...</span>
          <span v-else>Create Account</span>
        </button>

        <div class="login-link">
          Already have an account?
          <router-link to="/login">Sign in</router-link>
        </div>
      </form>

      <div v-if="showTerms" class="modal" @click.self="showTerms = false">
        <div class="modal-content">
          <h3>Terms of Service</h3>
          <div class="modal-body">
            <p>
              Please review our terms of service carefully before proceeding.
            </p>
            <p>
              By creating an account, you agree to our terms and conditions.
            </p>
          </div>
          <button class="modal-close" @click="showTerms = false">Close</button>
        </div>
      </div>

      <div v-if="showPrivacy" class="modal" @click.self="showPrivacy = false">
        <div class="modal-content">
          <h3>Privacy Policy</h3>
          <div class="modal-body">
            <p>
              Your privacy is important to us. Please review our privacy policy
              to understand how we handle your data.
            </p>
          </div>
          <button class="modal-close" @click="showPrivacy = false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const acceptedTerms = ref(false);
const showTerms = ref(false);
const showPrivacy = ref(false);
const loading = ref(false);
const formError = ref("");
const firstNameError = ref(false);
const lastNameError = ref(false);
const emailError = ref(false);
const passwordError = ref(false);
const confirmPasswordError = ref(false);
const termsError = ref(false);

const passwordsMatch = computed(() => password.value === confirmPassword.value);

const isFormValid = computed(() => {
  return (
    firstName.value.trim() &&
    lastName.value.trim() &&
    email.value &&
    password.value.length >= 6 &&
    passwordsMatch.value &&
    acceptedTerms.value
  );
});

const formSubmitted = ref(false);

const validateForm = () => {
  let isValid = true;
  formError.value = "";

  if (formSubmitted.value) {
    firstNameError.value = false;
    lastNameError.value = false;
    emailError.value = false;
    passwordError.value = false;
    confirmPasswordError.value = false;
    termsError.value = false;
  }

  if (!firstName.value.trim()) {
    firstNameError.value = true;
    formError.value = "First name is required";
    isValid = false;
  }

  if (!lastName.value.trim()) {
    lastNameError.value = true;
    if (!formError.value) formError.value = "Last name is required";
    isValid = false;
  }

  if (!email.value) {
    emailError.value = true;
    if (!formError.value) formError.value = "Email is required";
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = true;
    formError.value = "Please enter a valid email address";
    isValid = false;
  }

  if (!password.value) {
    passwordError.value = true;
    if (!formError.value) formError.value = "Password is required";
    isValid = false;
  } else if (password.value.length < 6) {
    passwordError.value = true;
    formError.value = "Password must be at least 6 characters";
    isValid = false;
  } else {
    const hasLetter = /[a-zA-Z]/.test(password.value);
    const hasNumber = /[0-9]/.test(password.value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+/.test(
      password.value
    );

    if (!(hasLetter && hasNumber && hasSpecialChar)) {
      passwordError.value = true;
      formError.value = "Password must include letters, numbers, and symbols";
      isValid = false;
    }
  }

  if (password.value !== confirmPassword.value) {
    passwordError.value = true;
    confirmPasswordError.value = true;
    formError.value = "Passwords do not match";
    isValid = false;
  }

  if (!acceptedTerms.value) {
    termsError.value = true;
    if (!formError.value)
      formError.value = "You must accept the terms and conditions";
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  formSubmitted.value = true;
  if (!validateForm()) return;

  loading.value = true;
  formError.value = "";

  try {
    console.log("Attempting to register user...");
    const userData = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    };
    console.log(
      "Sending registration data:",
      JSON.stringify(userData, null, 2)
    );

    await authStore.register(userData);

    console.log("Registration successful, redirecting...");
  } catch (error) {
    console.error("Registration failed with error:", error);

    let errorMessage = "Registration failed. Please try again.";
    let errorDetails = {};

    if (error.message) {
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;

        if (errorData.missingFields) {
          const missing = Object.entries(errorData.missingFields)
            .filter(([_, isMissing]) => isMissing)
            .map(([field]) => field)
            .join(", ");
          if (missing) {
            errorMessage = `Missing required fields: ${missing}`;
          }
        } else if (errorData.responseText) {
          errorMessage = `Server error: ${errorData.status || ""} ${
            errorData.statusText || ""
          }`.trim();
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
    }

    console.error("Registration error details:", errorDetails);
    formError.value = errorMessage;

    firstNameError.value = !firstName.value.trim();
    lastNameError.value = !lastName.value.trim();
    emailError.value = !email.value.trim() || !/\S+@\S+\.\S+/.test(email.value);
    passwordError.value = !password.value || password.value.length < 6;
    confirmPasswordError.value = password.value !== confirmPassword.value;
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

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin: 0 0 8px 0;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 24px;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
}

input.invalid {
  border-color: #c62828;
}

.password-input {
  position: relative;
}

.hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
}

.terms {
  display: flex;
  align-items: flex-start;
  margin: 15px 0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
}

.terms input[type="checkbox"] {
  margin: 3px 8px 0 0;
  flex-shrink: 0;
  align-self: flex-start;
  width: 14px;
  height: 14px;
  min-width: 14px;
  min-height: 14px;
}

.terms label {
  display: inline;
  margin: 0;
  font-weight: normal;
  flex: 1;
  word-break: break-word;
}

.terms a {
  color: var(--primary-color, #a100ff);
  text-decoration: none;
  white-space: nowrap;
  display: inline;
}

.terms a:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color, #a100ff);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.login-button:hover {
  background-color: var(--primary-hover, #8a00e6);
}

.login-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
  opacity: 0.7;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 0.95rem;
}

.login-link a {
  color: var(--primary-color, #a100ff);
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.login-link a:hover {
  text-decoration: underline;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

input.invalid {
  border-color: var(--error-color);
}

input:not(.invalid):not(:focus) {
  border-color: #ccc;
}

.password-input {
  position: relative;
  width: 100%;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.error-message {
  color: var(--error-color);
  background-color: #ffebee;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}
</style>
