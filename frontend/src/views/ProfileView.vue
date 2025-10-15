<template>
  <div class="profile-view">
    <div class="profile-header">
      <h2>My Profile</h2>
      <button class="logout-button" @click="handleLogout">Logout</button>
    </div>

    <div class="profile-container">
      <UserDetails />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import UserDetails from "@/components/UserDetails.vue";

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push("/login");
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  padding: 1.5rem 0;
  border-bottom: 1px solid #eaeaea;
}

.logout-button {
  background: #a100ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  min-width: auto;
  width: auto;
}

.logout-button:hover {
  background: #8a00e6;
  transform: translateY(-1px);
}

.profile-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: #666;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #a100ff;
}

.profile-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

@media (max-width: 768px) {
  .profile-view {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .profile-container {
    padding: 1rem;
  }
}
</style>
