/**
 * Modelo de dados para chamadas do sistema
 *
 * Define a estrutura de uma chamada hospitalar contendo todas as
 * informações necessárias para exibição no painel
 */
export interface CallData {
  /** Identificador único da chamada */
  id: string;

  /** Senha da chamada no formato SIGLA-XXXN (ex: CARD-001N) */
  password: string;

  /** Nome completo do médico responsável */
  doctorName: string;

  /** Especialidade médica */
  specialty: string;

  /** Número do guichê de atendimento */
  guichet: number;

  /** Data e hora de criação da chamada */
  timestamp: Date;
}

/**
 * Estados possíveis da aplicação
 *
 * Controla a interface e comportamento geral do sistema:
 * - DEFAULT: Estado padrão com vídeo no highlight
 * - CALLING: Estado de chamada ativa com informações no overlay
 */
export enum AppState {
  /** Estado padrão - mostra vídeo no highlight */
  DEFAULT = 'default',

  /** Estado de chamada ativa - mostra informações da chamada */
  CALLING = 'calling'
}
