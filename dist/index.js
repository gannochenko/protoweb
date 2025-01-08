#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const application_1 = require("./lib/application");
const d = (0, debug_1.default)('app');
const app = new application_1.Application();
app.run().catch(error => {
    console.error(`Error: ${error.message}`);
    d(error.stack);
    process.exit(1);
});
