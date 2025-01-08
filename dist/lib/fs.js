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
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderExists = folderExists;
exports.fileExists = fileExists;
exports.findProtoFiles = findProtoFiles;
exports.readFileContent = readFileContent;
exports.writeFileContent = writeFileContent;
const fs_1 = require("fs");
const path = __importStar(require("path"));
function folderExists(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield fs_1.promises.stat(folderPath);
            return stats.isDirectory();
        }
        catch (error) {
            return false;
        }
    });
}
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield fs_1.promises.stat(filePath);
            return stats.isFile();
        }
        catch (error) {
            return false;
        }
    });
}
function findProtoFiles(dir, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const entries = yield fs_1.promises.readdir(dir, {
                withFileTypes: true,
            });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    yield findProtoFiles(fullPath, callback);
                }
                else if (entry.isFile() && entry.name.endsWith('.proto')) {
                    yield callback(fullPath);
                }
            }
        }
        catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
        }
    });
}
function readFileContent(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return fs_1.promises.readFile(filePath, "utf-8");
    });
}
function writeFileContent(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs_1.promises.writeFile(filePath, content, 'utf8');
    });
}
