import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { Cliente } from "../models/Cliente.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("Cliente - Testes unitários", () => {
    it("deve criar um cliente válido", () => {
        const cliente = new Cliente({
            nome: "Maria Silva",
            email: "MARIA@email.com",
            telefone: "(11) 99999-9999"
        });

        expect(cliente.nome).toBe("Maria Silva");
        expect(cliente.email).toBe("maria@email.com");
        expect(cliente.telefone).toBe("(11) 99999-9999");
    });

    it("não deve permitir criar um cliente sem nome", () => {
        expect(() => {
            new Cliente({ nome: "", email: "maria@email.com", telefone: "11999999999" });
        }).toThrow('O campo "nome" é obrigatório.');
    });

    it("não deve permitir um e-mail inválido", () => {
        expect(() => {
            new Cliente({ nome: "Maria", email: "maria.email.com", telefone: "11999999999" });
        }).toThrow('O campo "email" deve ser um e-mail válido.');
    });

    it("não deve permitir um telefone sem DDD", () => {
        expect(() => {
            new Cliente({ nome: "Maria", email: "maria@email.com", telefone: "99999" });
        }).toThrow('O campo "telefone" deve ter 10 ou 11 dígitos, incluindo o DDD.');
    });
});

describe("Cliente - Testes de integração", () => {
    const novoCliente = { nome: "Maria Silva", email: "maria@email.com", telefone: "(11) 99999-9999" };

    async function limparBanco() {
        await prisma.agenda.deleteMany();
        await prisma.cliente.deleteMany();
    }

    beforeEach(limparBanco);

    afterAll(async () => {
        await limparBanco();
        await prisma.$disconnect();
    });

    it("POST /clientes deve cadastrar um cliente", async () => {
        const resposta = await request(app).post("/clientes").send(novoCliente);

        expect(resposta.status).toBe(201);
        expect(resposta.body.id).toBeDefined();
        expect(resposta.body.nome).toBe("Maria Silva");
    });

    it("POST /clientes não deve permitir e-mail repetido", async () => {
        await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).post("/clientes").send(novoCliente);

        expect(resposta.status).toBe(409);
        expect(resposta.body.message).toBe("Já existe um cliente cadastrado com este e-mail.");
    });

    it("POST /clientes deve retornar 400 com dados inválidos", async () => {
        const resposta = await request(app).post("/clientes").send({ nome: "Maria" });

        expect(resposta.status).toBe(400);
    });

    it("GET /clientes deve listar os clientes", async () => {
        await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).get("/clientes");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
    });

    it("GET /clientes/:id deve buscar um cliente pelo id", async () => {
        const criado = await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).get(`/clientes/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.email).toBe("maria@email.com");
    });

    it("GET /clientes/:id deve retornar 404 se o cliente não existir", async () => {
        const resposta = await request(app).get("/clientes/00000000-0000-4000-8000-000000000000");

        expect(resposta.status).toBe(404);
        expect(resposta.body.message).toBe("Cliente não encontrado.");
    });

    it("GET /clientes/:id deve retornar 400 se o id não for UUID", async () => {
        const resposta = await request(app).get("/clientes/123");

        expect(resposta.status).toBe(400);
    });

    it("PUT /clientes/:id deve atualizar um cliente", async () => {
        const criado = await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).put(`/clientes/${criado.body.id}`).send({ telefone: "(21) 98888-7777" });

        expect(resposta.status).toBe(200);
        expect(resposta.body.telefone).toBe("(21) 98888-7777");
        expect(resposta.body.nome).toBe("Maria Silva");
    });

    it("PUT /clientes/:id deve retornar 400 sem nenhum campo", async () => {
        const criado = await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).put(`/clientes/${criado.body.id}`).send({});

        expect(resposta.status).toBe(400);
    });

    it("DELETE /clientes/:id deve excluir um cliente", async () => {
        const criado = await request(app).post("/clientes").send(novoCliente);
        const resposta = await request(app).delete(`/clientes/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.message).toBe("Cliente removido com sucesso.");
    });
});
