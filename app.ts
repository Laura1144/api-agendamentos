import express from "express";
import { ClienteController } from "./src/Controllers/ClienteController.js";
import { ServicoController } from "./src/Controllers/ServicoController.js";
import { ProfissionalController } from "./src/Controllers/ProfissionalController.js";
import { AgendaController } from "./src/Controllers/AgendaController.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "API Agendamentos",
        version: "1.0.0"
    })
});

app.post("/cliente", ClienteController.criar);
app.get("/cliente", ClienteController.listar);
app.put("/cliente/:id", ClienteController.atualizar);
app.delete("/cliente/:id", ClienteController.deletar);

app.post("/servico", ServicoController.criar);
app.get("/servico", ServicoController.listar);
app.put("/servico/:id", ServicoController.atualizar);
app.delete("/servico/:id", ServicoController.deletar);

app.post("/profissional", ProfissionalController.criar);
app.get("/profissional", ProfissionalController.listar);
app.put("/profissional/:id", ProfissionalController.atualizar);
app.delete("/profissional/:id", ProfissionalController.deletar);

app.post("/agendamento", AgendaController.criar);
app.get("/agendamento", AgendaController.listar);
app.put("/agendamento/:id", AgendaController.atualizar);
app.delete("/agendamento/:id", AgendaController.deletar);

export {app};