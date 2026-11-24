import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" with { type: "json" };
import { clienteRoutes } from "./routes/clienteRoutes.js";
import { profissionalRoutes } from "./routes/profissionalRoutes.js";
import { servicoRoutes } from "./routes/servicoRoutes.js";
import { agendaRoutes } from "./routes/agendaRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { rotaNaoEncontrada } from "./middlewares/rotaNaoEncontrada.js";

const SWAGGER_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.36.0";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
    res.status(200).json({
        message: "API Agendamentos",
        version: "2.0.0",
        docs: "/api-docs"
    });
});

app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(swaggerDocument);
});
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        customSiteTitle: "API Agendamentos - Docs",
        customCssUrl: `${SWAGGER_CDN}/swagger-ui.css`,
        customJs: [`${SWAGGER_CDN}/swagger-ui-bundle.js`, `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`]
    })
);

app.use("/clientes", clienteRoutes);
app.use("/profissionais", profissionalRoutes);
app.use("/servicos", servicoRoutes);
app.use("/agendamentos", agendaRoutes);

app.use(rotaNaoEncontrada);
app.use(errorHandler);

export { app };
export default app;
