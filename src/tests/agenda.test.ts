import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { Agendamento } from "../models/Agendamento.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

function dataFutura(dias = 7) {
    const data = new Date();
    data.setUTCDate(data.getUTCDate() + dias);
    data.setUTCHours(14, 0, 0, 0);
    return data.toISOString();
}

describe("Agendamento - Testes unitários", () => {
    it("deve aceitar uma data no futuro", () => {
        const data = dataFutura();

        expect(Agendamento.validarData(data)).toEqual(new Date(data));
    });

    it("não deve permitir agendar em uma data passada", () => {
        expect(() => {
            Agendamento.validarData("2020-01-01T10:00:00.000Z");
        }).toThrow("Não é possível agendar em uma data passada.");
    });

    it("não deve permitir uma data inválida", () => {
        expect(() => {
            Agendamento.validarData("amanhã");
        }).toThrow("Data inválida");
    });

    it("deve aceitar apenas os status agendado, concluido e cancelado", () => {
        expect(Agendamento.validarStatus("cancelado")).toBe("cancelado");

        expect(() => {
            Agendamento.validarStatus("pendente");
        }).toThrow("Status inválido. Use: agendado, concluido, cancelado.");
    });

    it("um agendamento concluído ou cancelado deve estar finalizado", () => {
        expect(new Agendamento("agendado").estaFinalizado()).toBe(false);
        expect(new Agendamento("concluido").estaFinalizado()).toBe(true);
        expect(new Agendamento("cancelado").estaFinalizado()).toBe(true);
    });
});

describe("Agendamento - Testes de integração", () => {
    let ids: { clienteId: string; profissionalId: string; servicoId: string };

    async function limparBanco() {
        await prisma.agenda.deleteMany();
        await prisma.cliente.deleteMany();
        await prisma.profissional.deleteMany();
        await prisma.servico.deleteMany();
    }

    async function criarAgendamento(data = dataFutura()) {
        return request(app).post("/agendamentos").send({ data, ...ids });
    }

    beforeEach(async () => {
        await limparBanco();

        const cliente = await request(app)
            .post("/clientes")
            .send({ nome: "Maria Silva", email: "maria@email.com", telefone: "(11) 99999-9999" });
        const profissional = await request(app).post("/profissionais").send({ nome: "João Souza", email: "joao@email.com" });
        const servico = await request(app)
            .post("/servicos")
            .send({ nome: "Corte de cabelo", descricao: "Corte masculino", valor: 50 });

        ids = { clienteId: cliente.body.id, profissionalId: profissional.body.id, servicoId: servico.body.id };
    });

    afterAll(async () => {
        await limparBanco();
        await prisma.$disconnect();
    });

    it("POST /agendamentos deve criar com status 'agendado' e o valor do serviço", async () => {
        const resposta = await request(app)
            .post("/agendamentos")
            .send({ data: dataFutura(), ...ids, status: "concluido", valor: 1 });

        expect(resposta.status).toBe(201);
        expect(resposta.body.status).toBe("agendado");
        expect(Number(resposta.body.valor)).toBe(50);
        expect(resposta.body.cliente.nome).toBe("Maria Silva");
    });

    it("POST /agendamentos não deve permitir data passada", async () => {
        const resposta = await criarAgendamento("2020-01-01T10:00:00.000Z");

        expect(resposta.status).toBe(400);
        expect(resposta.body.message).toBe("Não é possível agendar em uma data passada.");
    });

    it("POST /agendamentos deve retornar 404 se o profissional não existir", async () => {
        const resposta = await request(app)
            .post("/agendamentos")
            .send({ data: dataFutura(), ...ids, profissionalId: "00000000-0000-4000-8000-000000000000" });

        expect(resposta.status).toBe(404);
        expect(resposta.body.message).toBe("Profissional não encontrado.");
    });

    it("POST /agendamentos não deve permitir dois agendamentos no mesmo horário", async () => {
        await criarAgendamento();
        const resposta = await criarAgendamento();

        expect(resposta.status).toBe(409);
        expect(resposta.body.message).toBe("Profissional já possui agendamento neste horário.");
    });

    it("GET /agendamentos deve listar os agendamentos", async () => {
        await criarAgendamento();
        const resposta = await request(app).get("/agendamentos");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
    });

    it("GET /agendamentos/:id deve buscar um agendamento pelo id", async () => {
        const criado = await criarAgendamento();
        const resposta = await request(app).get(`/agendamentos/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.profissional.nome).toBe("João Souza");
    });

    it("GET /agendamentos/:id deve retornar 404 se o agendamento não existir", async () => {
        const resposta = await request(app).get("/agendamentos/00000000-0000-4000-8000-000000000000");

        expect(resposta.status).toBe(404);
    });

    it("PUT /agendamentos/:id deve remarcar a data", async () => {
        const criado = await criarAgendamento();
        const novaData = dataFutura(10);
        const resposta = await request(app).put(`/agendamentos/${criado.body.id}`).send({ data: novaData });

        expect(resposta.status).toBe(200);
        expect(resposta.body.data).toBe(novaData);
    });

    it("PUT /agendamentos/:id não deve alterar um agendamento concluído", async () => {
        const criado = await criarAgendamento();
        await request(app).put(`/agendamentos/${criado.body.id}`).send({ status: "concluido" });

        const resposta = await request(app).put(`/agendamentos/${criado.body.id}`).send({ status: "cancelado" });

        expect(resposta.status).toBe(409);
        expect(resposta.body.message).toBe("Agendamentos concluídos ou cancelados não podem ser alterados.");
    });

    it("DELETE /clientes/:id não deve excluir cliente com agendamento", async () => {
        await criarAgendamento();
        const resposta = await request(app).delete(`/clientes/${ids.clienteId}`);

        expect(resposta.status).toBe(409);
    });

    it("DELETE /agendamentos/:id deve excluir um agendamento", async () => {
        const criado = await criarAgendamento();
        const resposta = await request(app).delete(`/agendamentos/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.message).toBe("Agendamento removido com sucesso.");
    });
});
