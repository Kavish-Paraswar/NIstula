"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
const client_1 = require("@prisma/client");
const env_js_1 = require("./env.js");
let prismaInstance = null;
function getPrisma() {
    if (!env_js_1.env.DATABASE_URL) {
        return null;
    }
    prismaInstance ??= new client_1.PrismaClient();
    return prismaInstance;
}
