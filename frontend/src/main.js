import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { setupRouter } from "./router/index.js";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const router = setupRouter(app);
app.use(router);

app.mount("#app");
