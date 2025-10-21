"use strict";
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let SearchService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SearchService = _classThis = class {
        constructor() {
            this.serviceUrls = {
                products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8001',
                inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8002',
                sales: process.env.SALES_SERVICE_URL || 'http://localhost:8003',
                customers: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:8005',
            };
        }
        async search(query, type, limit = 10) {
            if (!query || query.trim().length === 0) {
                return {
                    success: true,
                    data: {
                        results: [],
                        total: 0,
                    },
                };
            }
            const searchPromises = [];
            // Search products
            if (!type || type === 'products') {
                searchPromises.push(this.searchProducts(query, limit).catch(() => ({ type: 'products', results: [] })));
            }
            // Search customers
            if (!type || type === 'customers') {
                searchPromises.push(this.searchCustomers(query, limit).catch(() => ({ type: 'customers', results: [] })));
            }
            // Search invoices
            if (!type || type === 'invoices') {
                searchPromises.push(this.searchInvoices(query, limit).catch(() => ({ type: 'invoices', results: [] })));
            }
            const results = await Promise.all(searchPromises);
            const aggregated = results.reduce((acc, curr) => {
                acc[curr.type] = curr.results;
                return acc;
            }, {});
            const total = results.reduce((sum, curr) => sum + (curr.results?.length || 0), 0);
            return {
                success: true,
                data: {
                    query,
                    results: aggregated,
                    total,
                },
            };
        }
        async searchProducts(query, limit) {
            try {
                const response = await axios_1.default.get(`${this.serviceUrls.products}/api/v1/products`, {
                    params: { search: query, limit },
                    timeout: 5000,
                });
                return {
                    type: 'products',
                    results: response.data.data?.products || [],
                };
            }
            catch (error) {
                return { type: 'products', results: [] };
            }
        }
        async searchCustomers(query, limit) {
            try {
                const response = await axios_1.default.get(`${this.serviceUrls.customers}/api/v1/customers`, {
                    params: { search: query, limit },
                    timeout: 5000,
                });
                return {
                    type: 'customers',
                    results: response.data.data || [],
                };
            }
            catch (error) {
                return { type: 'customers', results: [] };
            }
        }
        async searchInvoices(query, limit) {
            try {
                const response = await axios_1.default.get(`${this.serviceUrls.sales}/api/v1/sales/invoices`, {
                    params: { search: query, limit },
                    timeout: 5000,
                });
                return {
                    type: 'invoices',
                    results: response.data.data?.invoices || [],
                };
            }
            catch (error) {
                return { type: 'invoices', results: [] };
            }
        }
    };
    __setFunctionName(_classThis, "SearchService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SearchService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SearchService = _classThis;
})();
exports.SearchService = SearchService;
//# sourceMappingURL=search.service.js.map