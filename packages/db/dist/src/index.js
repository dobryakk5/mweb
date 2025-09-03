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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbInstance = exports.db = exports.client = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "client", { enumerable: true, get: function () { return __importDefault(client_1).default; } });
var db_1 = require("./db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return __importDefault(db_1).default; } });
var db_2 = require("./db");
Object.defineProperty(exports, "dbInstance", { enumerable: true, get: function () { return __importDefault(db_2).default; } });
__exportStar(require("./orm"), exports);
__exportStar(require("./schema"), exports);
__exportStar(require("./schemas"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./queries"), exports);
__exportStar(require("./mutations"), exports);
//# sourceMappingURL=index.js.map