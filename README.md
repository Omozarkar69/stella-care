# 🏥 StellarCare

A decentralized community health insurance pool built on Stellar / Soroban.  
Members contribute monthly, submit healthcare claims, vote on approvals, and govern pool parameters — all on-chain.

🌐 **Live at → [stella-care.vercel.app](https://stella-care.vercel.app)**

---
demo video link 
https://drive.google.com/file/d/1kFkeHrhw1iNsUqzkiHuqG4fwS85DMokJ/view?usp=sharing
## 📸 Screenshots

<img width="1276" height="858" alt="Screenshot 2026-04-23 at 10 20 36 PM" src="https://github.com/user-attachments/assets/48baa099-cbb5-41fe-8611-2b2f398f32ea" />
<img width="1470" height="956" alt="Screenshot 2026-04-23 at 10 21 10 PM" src="https://github.com/user-attachments/assets/8e23d2a4-ff7f-4bc0-857d-aedaeea424d8" />
<img width="1470" height="956" alt="Screenshot 2026-04-23 at 10 21 20 PM" src="https://github.com/user-attachments/assets/e3d7d6ad-fd8d-4f4c-9afc-fb36ad474fbd" />
<img width="1470" height="956" alt="Screenshot 2026-04-23 at 10 21 26 PM" src="https://github.com/user-attachments/assets/7c205081-9863-41b1-b84e-f01f1bf096e0" />
<img width="1470" height="956" alt="Screenshot 2026-04-23 at 10 21 36 PM" src="https://github.com/user-attachments/assets/f79f189a-eced-4a8f-9ff8-f12d05cb1289" />
<img width="1470" height="956" alt="Screenshot 2026-04-23 at 10 21 43 PM" src="https://github.com/user-attachments/assets/a817ae1e-1aa3-494d-81c5-000450a0fe32" />

---

## 🟢 Green Belt — Level 4 Submission

| Requirement | Status |
|---|---|
| Advanced smart contracts (4 contracts) | ✅ |
| Inter-contract calls | ✅ |
| Custom token creation (CARE + HC) | ✅ |
| Full dApp frontend (React + Vite) | ✅ |
| Freighter wallet integration | ✅ |
| Mobile responsive UI | ✅ |
| CI/CD pipeline (GitHub Actions) | ✅ |
| Deployed on Stellar Testnet | ✅ |
| Production frontend deployed (Vercel) | ✅ |

---

## 📦 Smart Contracts

### Health Pool — Core Orchestrator
Manages membership, contributions, claim submission, and governance.

[![View on Stellar Expert](https://img.shields.io/badge/Stellar%20Expert-Health%20Pool-orange?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CDMMAR6XO6X2GSUY6CUKZ3W4SBTXIFHI3GDAX7AWBB76A7ZSR7DUJVEF)

---

### CARE Token — Governance Token
Custom Soroban token minted on join/contribute. Used for governance voting.

[![View on Stellar Expert](https://img.shields.io/badge/Stellar%20Expert-CARE%20Token-blue?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CA62AKNYSAFTK65GK3NYVKHYCUSE4PCWWXXT7SETINJIUN5QXXV7JL5W)

---

### Health Credit (HC) — Coverage Token
Custom Soroban token representing healthcare coverage. Issued on contribution, spent on claim disbursement.

[![View on Stellar Expert](https://img.shields.io/badge/Stellar%20Expert-Health%20Credit-green?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CBC3SEVXRF4D5ZPF4NKMM32BY75ZV6D2VTYAYPDG5JR5BEZGNQECRFSP)

---

### Claims Validator — Voting Engine
Handles claim submission, peer voting, and approval logic.

[![View on Stellar Expert](https://img.shields.io/badge/Stellar%20Expert-Claims%20Validator-purple?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CBFKTCCLGBBIGSKIPNH5ORLI6J2EXQZATE3YRGACWL3XA3TMIKR6HRWA)

---

## 🏗 Architecture

```
health-pool  ──calls──▶  care-token       (mint CARE on join/contribute)
             ──calls──▶  health-credit    (issue/spend HC)
             ──calls──▶  claims-validator (submit & check claims)
```

All 4 contracts are deployed independently on Testnet and communicate via inter-contract calls.

---

## 🚀 Running Locally

### Prerequisites
- [Rust](https://rustup.rs/) + `wasm32v1-none` target
- [stellar-cli](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)
- Node.js 20+
- [Freighter wallet](https://www.freighter.app/) browser extension (set to Testnet)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Contracts

```bash
# Build all contracts
stellar contract build

# Run tests
cargo test --workspace
```

---

## 🚢 Deployment

The frontend is deployed to Vercel and auto-builds on every push to `main`.

| | |
|---|---|
| Production URL | https://stella-care.vercel.app |
| Platform | Vercel |
| Build command | `cd frontend && npm install && npm run build` |
| Output directory | `frontend/dist` |

To deploy manually:

```bash
vercel deploy --prod
```

---

## 🔁 CI/CD

GitHub Actions runs on every push to `main`:

- **Contracts job** — builds all 4 Soroban contracts + runs the full test suite
- **Frontend job** — TypeScript type-check + Vite production build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## 📱 Features

- **Landing Page** — marketing homepage with hero, features, how-it-works, FAQ, and CTA
- **About Us** — team, mission, values, and tech stack
- **Join Pool** — pay 100 XLM/month, receive 500 HC + 100 CARE tokens on-chain
- **Monthly Contribution** — renew coverage, earn more HC and CARE
- **Submit Claims** — 6 claim types (hospital, surgery, dental, pharmacy, checkup, other)
- **Vote on Claims** — community peer review via claims-validator contract
- **Governance** — propose and vote on pool parameter changes using CARE tokens
- **Mobile responsive** — full hamburger nav, responsive grid, works on all screen sizes

---

## 🌐 Network

| | |
|---|---|
| Network | Stellar Testnet |
| RPC | https://soroban-testnet.stellar.org |
| Horizon | https://horizon-testnet.stellar.org |
