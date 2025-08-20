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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MVPParser = void 0;
const fs = __importStar(require("fs/promises"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
class MVPParser {
    async parse(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            // Basic size validation
            if (content.length > 10000000) {
                throw new Error('File too large (>10MB)');
            }
            let spec;
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.json') {
                spec = JSON.parse(content);
            }
            else if (ext === '.yaml' || ext === '.yml') {
                spec = yaml.load(content);
            }
            else {
                throw new Error('Unsupported file format. Use .json, .yaml, or .yml');
            }
            // Basic OpenAPI validation
            if (!spec.openapi && !spec.swagger) {
                throw new Error('Not a valid OpenAPI/Swagger specification');
            }
            if (!spec.paths) {
                throw new Error('OpenAPI specification must contain paths');
            }
            return spec;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to parse OpenAPI spec: ${error.message}`);
            }
            throw error;
        }
    }
}
exports.MVPParser = MVPParser;
//# sourceMappingURL=parser.js.map