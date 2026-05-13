"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUuid = createUuid;
const node_crypto_1 = require("node:crypto");
function createUuid() {
    return (0, node_crypto_1.randomUUID)();
}
