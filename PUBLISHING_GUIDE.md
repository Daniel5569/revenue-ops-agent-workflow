# Guida per obiettivi, test, sicurezza e pubblicazione su GitHub

## Obiettivo della repo

Questa repo serve come portfolio tecnico per mostrare un workflow RevOps/CRM credibile per startup B2B SaaS. Il messaggio principale e': non e' una demo di testo generato, ma un control plane operativo per eventi CRM, code asincrone, policy, approvazioni umane, idempotenza e audit trail.

## Cosa devi sapere prima di pubblicarla

- Il nome consigliato della repo e' `crm-revenue-ops-agent-workflow`.
- La repo non contiene segreti reali.
- `.env.example` puo' essere pubblicato; `.env` non va mai pubblicato.
- Le integrazioni CRM/email sono mockate in modo deterministico.
- Le azioni esterne rischiose sono bloccate o richiedono approvazione.
- Il comando principale di controllo e' `npm run check`.

## Cosa controllare prima del primo push

1. Apri la cartella della repo.
2. Esegui `npm run check`.
3. Verifica che non esista un file `.env` nella repo.
4. Verifica che `git status` non mostri file sensibili.
5. Leggi il `README.md` e controlla che descriva bene obiettivo, architettura e limiti.

## Come passarla su GitHub

Se vuoi creare la repo manualmente:

```bash
git init
git add .
git commit -m "Initial CRM Revenue Ops agent workflow"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/crm-revenue-ops-agent-workflow.git
git push -u origin main
```

Prima devi creare una repo vuota su GitHub con lo stesso nome: `crm-revenue-ops-agent-workflow`.

Se GitHub ti propone di aggiungere README, `.gitignore` o licenza dalla UI, evita di farlo: qui sono gia' presenti file locali.

## Test disponibili

- `npm run lint`: controlla struttura repo, file richiesti e contratti JSON.
- `npm run test:node`: testa validazione evento, idempotenza, policy e proposta.
- `npm run test:python`: testa scoring, policy e worker Python.
- `npm run security:scan`: cerca segreti e file rischiosi prima della pubblicazione.
- `npm run audit:deps`: controlla vulnerabilita' note nelle dipendenze npm.
- `npm run build`: verifica la build production della dashboard Next.js.
- `npm run compose:check`: valida `docker-compose.yml`.
- `npm run check`: esegue tutto in sequenza.

## Sicurezza e privacy

Non pubblicare mai:

- `.env`
- token GitHub
- password database reali
- chiavi API OpenAI, HubSpot, Salesforce, Slack, Gmail o SendGrid
- dati reali di lead, clienti, contatti, pipeline o email
- export CSV reali dal CRM

Questa repo usa solo dati demo. Se in futuro aggiungi integrazioni vere, mantieni le credenziali in GitHub Actions Secrets o nel secret manager della piattaforma di deploy.

## GitHub Actions

La pipeline e' in `.github/workflows/ci.yml`. A ogni push o pull request esegue:

- installazione Node
- setup Python
- test JavaScript
- test Python
- controllo sicurezza
- controllo Docker Compose

## Cosa dire quando la presenti

Pitch breve:

> This repo demonstrates a production-shaped RevOps agent workflow: CRM events are validated, deduplicated, queued asynchronously, scored by a deterministic Python engine, evaluated by policy, and converted into approval-gated proposed actions with a full audit trail.

Punti forti:

- boundary chiari tra gateway, worker, storage e dashboard
- niente azioni distruttive senza policy
- idempotenza e audit come requisiti di prodotto
- test locali e CI
- nessun segreto o dato cliente pubblicato

## Checklist finale

- [ ] `npm run check` passa.
- [ ] Nessun `.env` presente.
- [ ] Nessun segreto trovato da `npm run security:scan`.
- [ ] `npm run audit:deps` pulito.
- [ ] README aggiornato.
- [ ] Repo inizializzata con Git.
- [ ] Primo commit creato.
- [ ] Remote GitHub aggiunto solo dopo aver creato la repo vuota online.
