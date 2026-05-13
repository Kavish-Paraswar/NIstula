"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./utils/logger.js");
const app = (0, app_js_1.createApp)();
app.listen(env_js_1.env.PORT, () => {
    logger_js_1.logger.info({ port: env_js_1.env.PORT }, "Nistula guest messaging backend is running");
});
