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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBuild = void 0;
const protobuf = __importStar(require("protobufjs"));
const debug_1 = __importDefault(require("debug"));
const type_1 = require("./type");
const exec_1 = require("../lib/exec");
const fs_1 = require("../lib/fs");
const path_1 = __importDefault(require("path"));
const protoParser = __importStar(require("proto-parser"));
const proto_1 = require("../lib/proto");
const template_1 = require("../lib/template");
const d = (0, debug_1.default)('run');
let CommandBuild = (() => {
    let _classDecorators = [(0, type_1.Implements)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CommandBuild = _classThis = class {
        static attach(program, actionCallback) {
            program
                .command('build')
                .alias('b')
                .description('build proto files')
                .requiredOption('-i, --input <folder>', 'folder where the proto files to build are kept')
                .requiredOption('-o, --output <folder>', 'folder where the compiled files must be created')
                .option('-r, --root <folder>', 'folder where the all proto files are kept')
                .option('-t, --template <file>', 'template file')
                // .option('-y, --yes', 'Use the default')
                .action((options, command) => {
                return actionCallback({
                    command: this,
                    arguments: options,
                });
            });
        }
        static process(application, args) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!(yield (0, fs_1.folderExists)(args.input))) {
                    console.error(`Error: folder ${args.input} does not exist.`);
                    return;
                }
                const input = path_1.default.resolve(args.input);
                if (!(yield (0, fs_1.folderExists)(args.output))) {
                    console.error(`Error: folder ${args.output} does not exist.`);
                    return;
                }
                const output = path_1.default.resolve(args.output);
                if (args.template) {
                    if (!(yield (0, fs_1.fileExists)(args.template))) {
                        console.error(`Error: template ${args.template} does not exist.`);
                        return;
                    }
                }
                const template = args.template ? path_1.default.resolve(args.template) : undefined;
                if (args.root) {
                    if (!(yield (0, fs_1.folderExists)(args.root))) {
                        console.error(`Error: folder ${args.root} does not exist.`);
                        return;
                    }
                }
                const root = args.root ? path_1.default.resolve(args.root) : undefined;
                if (!(yield (0, exec_1.isCommandAvailable)("protoc"))) {
                    console.error("Error: protoc is not installed. Install it and try again.");
                    return;
                }
                if (!(yield (0, exec_1.isCommandAvailable)("protoc-gen-ts_proto"))) {
                    console.error("Error: protoc-gen-ts_proto is not installed. Install it and try again.");
                    return;
                }
                const options = {
                    cwd: process.cwd(),
                };
                const protoRoot = root !== null && root !== void 0 ? root : input;
                const templateCode = require(template !== null && template !== void 0 ? template : "../templates/fetch");
                // @ts-ignore
                if (typeof templateCode.renderTemplate !== "function") {
                    console.error("Error: function renderTemplate() is missing in the template. Define it, and try again.");
                    return;
                }
                // build types
                yield (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const findResult = yield (0, exec_1.runCommand)('find', [
                            input,
                            '-name',
                            '*.proto',
                        ], options);
                        const protoFiles = findResult.stdout.trim().split('\n');
                        if (protoFiles.length === 0) {
                            console.log('No .proto files found.');
                            return;
                        }
                        yield (0, exec_1.runCommand)('protoc', [
                            '--plugin=protoc-gen-ts_proto=' + (yield (0, exec_1.runCommand)('which', ['protoc-gen-ts_proto'], options)).stdout.trim(),
                            `--ts_proto_out=${output}`,
                            '--ts_proto_opt=onlyTypes=true',
                            '-I',
                            protoRoot,
                            ...protoFiles,
                        ], options);
                    }
                    catch (error) {
                        console.error("Error building types:", error);
                    }
                }))();
                const resolvePath = (origin, target) => {
                    return path_1.default.resolve(input, target);
                };
                const commonRoot = new protobuf.Root();
                commonRoot.resolvePath = resolvePath;
                // build services
                yield (0, fs_1.findProtoFiles)(input, (filePath) => __awaiter(this, void 0, void 0, function* () {
                    let dstPath = "";
                    try {
                        const content = yield (0, fs_1.readFileContent)(filePath);
                        const ast = protoParser.parse(content);
                        const services = [];
                        // @ts-ignore
                        const result = (0, proto_1.findServiceDefinitions)(ast.root, services);
                        if (result.length) {
                            result.forEach(service => {
                                console.log(`👉 ${filePath} => ${service.name}`);
                                Object.keys(service.methods).forEach(methodName => {
                                    const method = service.methods[methodName];
                                    console.log(`   ✅ ${method.name}`);
                                });
                            });
                            // match the file
                            const relativePath = filePath.replace(protoRoot, "").replace(".proto", ".ts");
                            dstPath = path_1.default.join(output, relativePath);
                            const protocOutput = yield (0, fs_1.readFileContent)(dstPath);
                            const fileContent = templateCode.renderTemplate({
                                protocOutput,
                                services: (0, template_1.toTemplateServices)(result),
                            });
                            yield (0, fs_1.writeFileContent)(dstPath, fileContent);
                        }
                        else {
                            console.info(`❌ no service definitions in file ${filePath}`);
                        }
                    }
                    catch (error) {
                        console.error(`Error writing service definitions for files "${filePath}" => "${dstPath}":`, error);
                    }
                }));
                d('Executed successfully');
            });
        }
    };
    __setFunctionName(_classThis, "CommandBuild");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CommandBuild = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CommandBuild = _classThis;
})();
exports.CommandBuild = CommandBuild;
