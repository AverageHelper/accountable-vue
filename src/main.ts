import { createPinia } from "pinia";
import { createApp } from "vue";
import { bootstrap } from "./db/wrapper";
import App from "./App.vue";

bootstrap();

createApp(App) //
	.use(createPinia())
	.mount("#app");
