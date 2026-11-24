import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { Servico } from "../models/Servico.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("Servico - Testes unitários", () => {
    it("deve criar um serviço válido", () => {
        const servico = new Servico({ nome: "Corte de cabelo", descricao: "Corte masculino", valor: 50 });

        expect(servico.nome).toBe("Corte de cabelo");
        expect(servico.descricao).toBe("Corte masculino");
        expect(servico.valor).toBe(50);
    });

    it("deve aceitar o valor como texto e arredondar para 2 casas", () => {
        const servico = new Servico({ nome: "Barba", descricao: "Barba completa", valor: "29.999" });

        expect(servico.valor).toBe(30);
    });

    it("não deve permitir valor negativo ou zero", () => {
        expect(() => {
            new Servico({ nome: "Corte", descricao: "Corte", valor: -10 });
        }).toThrow("O valor do serviço deve ser maior que zero.");

        expect(() => {
            new Servico({ nome: "Corte", descricao: "Corte", valor: 0 });
        }).toThrow("O valor do serviço deve ser maior que zero.");
    });

    it("não deve permitir valor que não é número", () => {
        expect(() => {
            new Servico({ nome: "Corte", descricao: "Corte", valor: "abc" });
        }).toThrow('O campo "valor" deve ser um número.');
    });

    it("não deve permitir valor acima do máximo", () => {
        expect(() => {
            new Servico({ nome: "Corte", descricao: "Corte", valor: 1000000000 });
        }).toThrow("O valor do serviço é maior que o permitido.");
    });

    it("não deve permitir criar um serviço sem descrição", () => {
        expect(() => {
            new Servico({ nome: "Corte", descricao: "", valor: 50 });
        }).toThrow('O campo "descricao" é obrigatório.');
    });
});

describe("Servico - Testes de integração", () => {
    const novoServico = { nome: "Corte de cabelo", descricao: "Corte masculino", valor: 50 };

    async function limparBanco() {
        await prisma.agenda.deleteMany();
        await prisma.servico.deleteMany();
    }

    beforeEach(limparBanco);

    afterAll(async () => {
        await limparBanco();
        await prisma.$disconnect();
    });

    it("POST /servicos deve cadastrar um serviço", async () => {
        const resposta = await request(app).post("/servicos").send(novoServico);

        expect(resposta.status).toBe(201);
        expect(resposta.body.id).toBeDefined();
        expect(Number(resposta.body.valor)).toBe(50);
    });

    it("POST /servicos não deve permitir valor negativo", async () => {
        const resposta = await request(app).post("/servicos").send({ ...novoServico, valor: -5 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.message).toBe("O valor do serviço deve ser maior que zero.");
    });

    it("POST /servicos não deve permitir nome repetido", async () => {
        await request(app).post("/servicos").send(novoServico);
        const resposta = await request(app).post("/servicos").send(novoServico);

        expect(resposta.status).toBe(409);
    });

    it("GET /servicos deve listar os serviços", async () => {
        await request(app).post("/servicos").send(novoServico);
        const resposta = await request(app).get("/servicos");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
    });

    it("GET /servicos/:id deve buscar um serviço pelo id", async () => {
        const criado = await request(app).post("/servicos").send(novoServico);
        const resposta = await request(app).get(`/servicos/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.nome).toBe("Corte de cabelo");
    });

    it("GET /servicos/:id deve retornar 404 se o serviço não existir", async () => {
        const resposta = await request(app).get("/servicos/00000000-0000-4000-8000-000000000000");

        expect(resposta.status).toBe(404);
    });

    it("PUT /servicos/:id deve atualizar o valor de um serviço", async () => {
        const criado = await request(app).post("/servicos").send(novoServico);
        const resposta = await request(app).put(`/servicos/${criado.body.id}`).send({ valor: 65 });

        expect(resposta.status).toBe(200);
        expect(Number(resposta.body.valor)).toBe(65);
        expect(resposta.body.nome).toBe("Corte de cabelo");
    });

    it("DELETE /servicos/:id deve excluir um serviço", async () => {
        const criado = await request(app).post("/servicos").send(novoServico);
        const resposta = await request(app).delete(`/servicos/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.message).toBe("Serviço removido com sucesso.");
    });
});
