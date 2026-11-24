import { DadoInvalidoError } from "../errors/DadoInvalido.js";

export class Validacao {
    private static readonly REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    private static readonly REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    static uuid(valor: unknown, campo = "id"): string {
        if (typeof valor !== "string" || !Validacao.REGEX_UUID.test(valor)) {
            throw new DadoInvalidoError(`O campo "${campo}" deve ser um UUID válido.`);
        }

        return valor;
    }

    static texto(valor: unknown, campo: string, tamanhoMaximo: number): string {
        if (typeof valor !== "string" || valor.trim() === "") {
            throw new DadoInvalidoError(`O campo "${campo}" é obrigatório.`);
        }

        const texto = valor.trim();

        if (texto.length > tamanhoMaximo) {
            throw new DadoInvalidoError(`O campo "${campo}" deve ter no máximo ${tamanhoMaximo} caracteres.`);
        }

        return texto;
    }

    static email(valor: unknown): string {
        const email = Validacao.texto(valor, "email", 150).toLowerCase();

        if (!Validacao.REGEX_EMAIL.test(email)) {
            throw new DadoInvalidoError('O campo "email" deve ser um e-mail válido.');
        }

        return email;
    }

    static telefone(valor: unknown): string {
        const telefone = Validacao.texto(valor, "telefone", 20);
        const digitos = telefone.replace(/\D/g, "");

        if (digitos.length < 10 || digitos.length > 11) {
            throw new DadoInvalidoError('O campo "telefone" deve ter 10 ou 11 dígitos, incluindo o DDD.');
        }

        return telefone;
    }
}
