"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_node_1 = require("@opentelemetry/sdk-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const serviceName = process.env.OTEL_SERVICE_NAME || "api-gateway";
const sdk = new sdk_node_1.NodeSDK({
    resource: new resources_1.Resource({ [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
    traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || "http://localhost:4318/v1/traces",
    }),
    instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
});
try {
    sdk.start();
    console.log(`[OTel] Tracing started for ${serviceName}`);
}
catch (e) {
    console.error("[OTel] Start error", e);
}
process.on("SIGTERM", () => {
    sdk
        .shutdown()
        .then(() => console.log("[OTel] Tracing terminated"))
        .catch((error) => console.log("[OTel] Error terminating tracing", error))
        .finally(() => process.exit(0));
});
//# sourceMappingURL=tracing.js.map