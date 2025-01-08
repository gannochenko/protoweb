"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RC = void 0;
// @ts-ignore
const find_up_all_1 = __importDefault(require("find-up-all"));
const debug_1 = __importDefault(require("debug"));
const d = (0, debug_1.default)('app');
const defaultSettings = {};
class RC {
    static getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config) {
                const files = yield (0, find_up_all_1.default)('.protowebrc', {
                    cwd: process.cwd(),
                });
                d(files);
                if (!files || !files[0]) {
                    return defaultSettings;
                }
                const [rcFile] = files;
                d(`RC file found at: ${rcFile}`);
                try {
                    this.config = yield Promise.resolve(`${rcFile}`).then(s => __importStar(require(s)));
                }
                catch (e) {
                    console.error(`Was not able to import the RC file located at: ${rcFile}: ${e.message}`);
                    d(e.stack);
                    return defaultSettings;
                }
            }
            return Object.assign(Object.assign({}, defaultSettings), this.config);
        });
    }
}
exports.RC = RC;
