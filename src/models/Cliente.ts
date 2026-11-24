import { Pessoa, type DadosPessoa } from "./Pessoa.js";
import { Validacao } from "./Validacao.js";

export interface DadosCliente extends DadosPessoa {
    telefone: unknown;
}

export class Cliente extends Pessoa {
    readonly telefone: string;

    constructor(dados: DadosCliente) {
        super(dados);
        this.telefone = Validacao.telefone(dados.telefone);
    }

    paraPersistencia() {
        return {
            nome: this.nome,
            email: this.email,
            telefone: this.telefone
        };
    }
}
