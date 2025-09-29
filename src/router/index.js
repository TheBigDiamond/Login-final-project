import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProfileView from "../views/ProfileView.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      title: "Login",
      requiresGuest: true,
    },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: {
      title: "Create an Account",
      requiresGuest: true,
    },
  },
  {
    path: "/",
    redirect: "/dashboard",
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    component: DashboardView,
    meta: {
      title: "My Profile",
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        redirect: { name: "profile" },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: { title: "My Profile" },
      },
    ],
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("../views/ForgotPasswordView.vue"),
    meta: {
      title: "Reset Password",
      requiresGuest: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0, behavior: "smooth" };
  },
});

export function setupRouter(app) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    document.title = to.meta.title
      ? `${to.meta.title} | Accenture`
      : "Accenture";

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!authStore.isAuthenticated) {
        next({
          name: "login",
          query: { redirect: to.fullPath },
        });
        return;
      }
    }

    if (
      to.matched.some((record) => record.meta.requiresGuest) &&
      authStore.isAuthenticated
    ) {
      next({ name: "dashboard" });
      return;
    }

    next();
  });

  return router;
}

export default router;
