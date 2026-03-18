# Projeto Bella Beauty – Contexto do Backend

## Stack

* NestJS
* Prisma
* SQLite (dev.db)
* JWT Auth
* API REST
* Swagger

## Estrutura do sistema

Módulos principais:

* auth
* users
* clients
* appointments
* schedule-blocks
* payments
* commissions
* dashboard
* finance

## Funcionalidades já implementadas

### Agenda

* criação de agendamento
* conflito automático de horários
* bloqueio de agenda
* timeline diária
* timeline semanal
* remarcação
* cancelamento
* check-in
* no-show
* conclusão de atendimento

### Financeiro

* geração automática de pagamento ao concluir atendimento
* cálculo automático de comissão
* módulo financeiro separado
* dashboard com:

  * top clientes
  * top serviços
  * ranking de profissionais

## Arquitetura

NestJS modular:

src/
auth/
users/
clients/
appointments/
schedule-blocks/
payments/
commissions/
dashboard/
finance/
prisma/

## Regras importantes do sistema

* todos endpoints usam salonId do JWT
* agendamento bloqueia slots por duração do serviço
* serviços possuem:

  * duration
  * bufferTime
* slots são de 15 minutos
* conflitos são verificados antes de criar agendamento

## Status atual do desenvolvimento

Backend funcionando.

Última tarefa executada:
Correção completa do AppointmentsService para incluir:

* getTimelineWeek
* reschedule
* cancel
* checkIn
* complete
* noShow

Sistema compilando corretamente.

## Próximos passos planejados

* otimizar timeline (reduzir queries)
* dashboard financeiro avançado
* relatórios
* controle de caixa
* estoque
* comandas

## Objetivo do projeto

Criar um SaaS completo de gestão de salão (tipo Trinks / Fresha / Booksy).
