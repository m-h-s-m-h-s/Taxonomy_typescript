"use strict";
/**
 * TypeScript Taxonomy Navigator
 *
 * Export main components for external use
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSimpleBatchTester = exports.runInteractiveInterface = exports.TaxonomyInterface = exports.TaxonomyNavigator = void 0;
var TaxonomyNavigator_1 = require("./TaxonomyNavigator");
Object.defineProperty(exports, "TaxonomyNavigator", { enumerable: true, get: function () { return TaxonomyNavigator_1.TaxonomyNavigator; } });
__exportStar(require("./types"), exports);
__exportStar(require("./config"), exports);
var interactiveInterface_1 = require("./interactiveInterface");
Object.defineProperty(exports, "TaxonomyInterface", { enumerable: true, get: function () { return interactiveInterface_1.TaxonomyInterface; } });
Object.defineProperty(exports, "runInteractiveInterface", { enumerable: true, get: function () { return interactiveInterface_1.main; } });
var simpleBatchTester_1 = require("./simpleBatchTester");
Object.defineProperty(exports, "runSimpleBatchTester", { enumerable: true, get: function () { return simpleBatchTester_1.main; } });
//# sourceMappingURL=index.js.map