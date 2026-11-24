import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { Profissional } from "../models/Profissional.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("Profissional - Testes unitários", () => {
    it("deve criar um profissional válido", () => {
        const profissional = new Profissional({ nome: "  João Souza  ", email: "joao@email.com" });

        expect(profissional.nome).toBe("João Souza");
        expect(profissional.email).toBe("joao@email.com");
    });

    it("não deve permitir criar um profissional sem nome", () => {
        expect(() => {
            new Profissional({ nome: "", email: "joao@email.com" });
        }).toThrow('O campo "nome" é obrigatório.');
    });

    it("não deve permitir criar um profissional sem e-mail", () => {
        expect(() => {
            new Profissional({ nome: "João", email: undefined });
        }).toThrow('O campo "email" é obrigatório.');
    });

    it("não deve permitir um nome com mais de 100 caracteres", () => {
        expect(() => {
            new Profissional({ nome: "a".repeat(101), email: "joao@email.com" });
        }).toThrow('O campo "nome" deve ter no máximo 100 caracteres.');
    });
});

describe("Profissional - Testes de integração", () => {
    const novoProfissional = { nome: "João Souza", email: "joao@email.com" };

    async function limparBanco() {
        await prisma.agenda.deleteMany();
        await prisma.profissional.deleteMany();
    }

    beforeEach(limparBanco);

    afterAll(async () => {
        await limparBanco();
        await prisma.$disconnect();
    });

    it("POST /profissionais deve cadastrar um profissional", async () => {
        const resposta = await request(app).post("/profissionais").send(novoProfissional);

        expect(resposta.status).toBe(201);
        expect(resposta.body.id).toBeDefined();
        expect(resposta.body.nome).toBe("João Souza");
    });

    it("POST /profissionais não deve permitir e-mail repetido", async () => {
        await request(app).post("/profissionais").send(novoProfissional);
        const resposta = await request(app).post("/profissionais").send(novoProfissional);

        expect(resposta.status).toBe(409);
    });

    it("GET /profissionais deve listar os profissionais", async () => {
        await request(app).post("/profissionais").send(novoProfissional);
        const resposta = await request(app).get("/profissionais");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
    });

    it("GET /profissionais/:id deve buscar um profissional pelo id", async () => {
        const criado = await request(app).post("/profissionais").send(novoProfissional);
        const resposta = await request(app).get(`/profissionais/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.nome).toBe("João Souza");
    });

    it("GET /profissionais/:id deve retornar 404 se o profissional não existir", async () => {
        const resposta = await request(app).get("/profissionais/00000000-0000-4000-8000-000000000000");

        expect(resposta.status).toBe(404);
        expect(resposta.body.message).toBe("Profissional não encontrado.");
    });

    it("PUT /profissionais/:id deve atualizar um profissional", async () => {
        const criado = await request(app).post("/profissionais").send(novoProfissional);
        const resposta = await request(app).put(`/profissionais/${criado.body.id}`).send({ nome: "João Lima" });

        expect(resposta.status).toBe(200);
        expect(resposta.body.nome).toBe("João Lima");
    });

    it("DELETE /profissionais/:id deve excluir um profissional", async () => {
        const criado = await request(app).post("/profissionais").send(novoProfissional);
        const resposta = await request(app).delete(`/profissionais/${criado.body.id}`);

        expect(resposta.status).toBe(200);
        expect(resposta.body.message).toBe("Profissional removido com sucesso.");
    });
});
