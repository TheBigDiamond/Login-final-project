<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>Accenture</h1>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: white;
  color: #333;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  height: 64px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo h1 {
  margin: 0;
  color: #a100ff;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logout-button {
  background: transparent;
  border: 1px solid #a100ff;
  color: white;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(161, 0, 255, 0.1);
}

.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .header-content {
    padding: 0 1.5rem;
  }

  .nav ul {
    gap: 1.25rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }

  .nav {
    display: none;
  }

  .main-content {
    padding: 1.5rem 1rem;
  }
}
</style>
