import { NodeSDK } from "@opentelemetry/sdk-node"
import { Resource } from "@opentelemetry/resources"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"

const serviceName = process.env.OTEL_SERVICE_NAME || "api-gateway"

const sdk = new NodeSDK({
  resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || "http://localhost:4318/v1/traces",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

try {
  sdk.start()
  console.log(`[OTel] Tracing started for ${serviceName}`)
} catch (e: any) {
  console.error("[OTel] Start error", e)
}

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("[OTel] Tracing terminated"))
    .catch((error) => console.log("[OTel] Error terminating tracing", error))
    .finally(() => process.exit(0))
})
