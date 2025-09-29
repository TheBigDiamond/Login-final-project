<template>
  <router-view />
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth.js";

const authStore = useAuthStore();

onMounted(() => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      authStore.user = JSON.parse(user);
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      authStore.logout();
    }
  }
});
</script>

<style>
:root {
  --primary-color: #a100ff;
  --primary-hover: #8a00e6;
  --text-color: #333;
  --light-gray: #f5f5f5;
  --border-color: #ddd;
  --error-color: #e74c3c;
  --success-color: #2ecc71;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

body,
html {
  height: 100%;
  margin: 0;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
