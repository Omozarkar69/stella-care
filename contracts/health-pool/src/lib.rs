//! HealthPool — core contract. Orchestrates inter-contract calls.
//! Rules learned from debugging:
//!   - No panic!/assert!/unwrap() — use contracterror + Result
//!   - Inter-contract callees (mint, issue, spend, submit) have no require_auth
//!   - Use wasm32v1-none target (stellar contract build)
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    symbol_short, Address, Env, String,
};

// ── Inter-contract clients ────────────────────────────────────────────────────

mod care {
    use soroban_sdk::{contractclient, Address, Env};
    #[contractclient(name = "CareClient")]
    pub trait CareTrait {
        fn mint(env: Env, to: Address, amount: i128);
        fn balance(env: Env, of: Address) -> i128;
    }
}
mod hc {
    use soroban_sdk::{contractclient, Address, Env};
    #[contractclient(name = "HcClient")]
    pub trait HcTrait {
        fn issue(env: Env, to: Address, amount: i128);
        fn spend(env: Env, from: Address, amount: i128);
        fn credits(env: Env, of: Address) -> i128;
    }
}
mod cv {
    use soroban_sdk::{contractclient, Address, Env, String};
    #[contractclient(name = "CvClient")]
    pub trait CvTrait {
        fn submit(env: Env, claimant: Address, amount: i128, desc: String) -> u64;
        fn is_approved(env: Env, id: u64) -> bool;
        fn get(env: Env, id: u64) -> Option<crate::ClaimView>;
    }
}

// ── Shared view type (mirrors claims-validator::Claim) ────────────────────────

#[contracttype] #[derive(Clone, PartialEq)]
pub enum ClaimStatus { Pending, Approved, Rejected }

#[contracttype] #[derive(Clone)]
pub struct ClaimView {
    pub claimant:  Address,
    pub amount:    i128,
    pub desc:      String,
    pub status:    ClaimStatus,
    pub for_v:     u32,
    pub against_v: u32,
}

// ── Storage types ─────────────────────────────────────────────────────────────

#[contracterror] #[derive(Copy, Clone, Debug, PartialEq)]
pub enum Error {
    AlreadyInit    = 1,
    AlreadyMember  = 2,
    NotMember      = 3,
    NotApproved    = 4,
    WrongClaimant  = 5,
    AlreadyVoted   = 6,
    AlreadyExec    = 7,
    NotPassed      = 8,
    NotFound       = 9,
    NoCare         = 10,
}

#[contracttype] #[derive(Clone)]
pub struct Config {
    pub admin:       Address,
    pub care:        Address,
    pub hc:          Address,
    pub cv:          Address,
    pub contrib:     i128,   // monthly contribution in stroops
    pub cpc:         i128,   // credits per contribution
    pub funds:       i128,
    pub members:     u32,
}

#[contracttype] #[derive(Clone)]
pub struct Member {
    pub joined:      u64,
    pub contributed: i128,
    pub reputation:  u32,
}

#[contracttype] #[derive(Clone)]
pub struct Proposal {
    pub proposer:    Address,
    pub desc:        String,
    pub new_contrib: i128,
    pub for_v:       u32,
    pub against_v:   u32,
    pub executed:    bool,
}

#[contracttype] #[derive(Clone)]
pub enum Key {
    Config,
    Member(Address),
    Proposal(u64),
    PropCount,
    Voted(u64, Address),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract] pub struct HealthPool;

#[contractimpl]
impl HealthPool {

    pub fn init(
        env: Env,
        admin: Address,
        care: Address,
        hc: Address,
        cv: Address,
        contrib: i128,
        cpc: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Config) { return Err(Error::AlreadyInit); }
        env.storage().instance().set(&Key::Config, &Config {
            admin, care, hc, cv, contrib, cpc, funds: 0, members: 0,
        });
        env.storage().instance().set(&Key::PropCount, &0_u64);
        Ok(())
    }

    fn cfg(env: &Env) -> Option<Config> { env.storage().instance().get(&Key::Config) }
    fn save(env: &Env, c: Config) { env.storage().instance().set(&Key::Config, &c); }

    pub fn config(env: Env) -> Option<Config> { Self::cfg(&env) }
    pub fn member_count(env: Env) -> u32 { Self::cfg(&env).map(|c| c.members).unwrap_or(0) }
    pub fn total_funds(env: Env) -> i128 { Self::cfg(&env).map(|c| c.funds).unwrap_or(0) }

    pub fn is_member(env: Env, addr: Address) -> bool {
        env.storage().persistent().has(&Key::Member(addr))
    }

    pub fn get_member(env: Env, addr: Address) -> Option<Member> {
        env.storage().persistent().get(&Key::Member(addr))
    }

    // ── Join ──────────────────────────────────────────────────────────────────

    pub fn join(env: Env, member: Address) -> Result<(), Error> {
        member.require_auth();
        if env.storage().persistent().has(&Key::Member(member.clone())) {
            return Err(Error::AlreadyMember);
        }
        let mut cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;

        // Inter-contract: issue HEALTH credits (no auth needed on callee)
        hc::HcClient::new(&env, &cfg.hc).issue(&member, &cfg.cpc);
        // Inter-contract: mint CARE tokens (no auth needed on callee)
        care::CareClient::new(&env, &cfg.care).mint(&member, &100_i128);

        env.storage().persistent().set(&Key::Member(member.clone()), &Member {
            joined: env.ledger().timestamp(),
            contributed: cfg.contrib,
            reputation: 100,
        });
        cfg.funds += cfg.contrib;
        cfg.members += 1;
        Self::save(&env, cfg);
        env.events().publish((symbol_short!("joined"),), (member,));
        Ok(())
    }

    // ── Contribute ────────────────────────────────────────────────────────────

    pub fn contribute(env: Env, member: Address) -> Result<(), Error> {
        member.require_auth();
        let mut m: Member = env.storage().persistent()
            .get(&Key::Member(member.clone())).ok_or(Error::NotMember)?;
        let mut cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;

        hc::HcClient::new(&env, &cfg.hc).issue(&member, &cfg.cpc);
        care::CareClient::new(&env, &cfg.care).mint(&member, &10_i128);

        m.contributed += cfg.contrib;
        m.reputation = (m.reputation + 5).min(1000);
        env.storage().persistent().set(&Key::Member(member.clone()), &m);
        cfg.funds += cfg.contrib;
        Self::save(&env, cfg);
        env.events().publish((symbol_short!("contrib"),), (member,));
        Ok(())
    }

    // ── Submit Claim ──────────────────────────────────────────────────────────

    pub fn submit_claim(env: Env, member: Address, amount: i128, desc: String) -> Result<u64, Error> {
        member.require_auth();
        if !env.storage().persistent().has(&Key::Member(member.clone())) {
            return Err(Error::NotMember);
        }
        let cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;
        // Inter-contract: delegate to claims-validator (no auth needed on callee)
        let id = cv::CvClient::new(&env, &cfg.cv).submit(&member, &amount, &desc);
        env.events().publish((symbol_short!("claim"),), (member, id, amount));
        Ok(id)
    }

    // ── Disburse Claim ────────────────────────────────────────────────────────

    pub fn disburse(env: Env, id: u64, member: Address) -> Result<(), Error> {
        let cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;
        cfg.admin.require_auth();
        let cv_c = cv::CvClient::new(&env, &cfg.cv);
        if !cv_c.is_approved(&id) { return Err(Error::NotApproved); }
        let claim = cv_c.get(&id).ok_or(Error::NotFound)?;
        if claim.claimant != member { return Err(Error::WrongClaimant); }
        hc::HcClient::new(&env, &cfg.hc).spend(&member, &claim.amount);
        let mut c = Self::cfg(&env).ok_or(Error::AlreadyInit)?;
        c.funds -= claim.amount;
        Self::save(&env, c);
        env.events().publish((symbol_short!("disburse"),), (id, member, claim.amount));
        Ok(())
    }

    // ── Governance ────────────────────────────────────────────────────────────

    pub fn create_proposal(env: Env, proposer: Address, desc: String, new_contrib: i128) -> Result<u64, Error> {
        proposer.require_auth();
        if !env.storage().persistent().has(&Key::Member(proposer.clone())) {
            return Err(Error::NotMember);
        }
        let n: u64 = env.storage().instance().get(&Key::PropCount).unwrap_or(0);
        let pid = n + 1;
        env.storage().persistent().set(&Key::Proposal(pid), &Proposal {
            proposer: proposer.clone(), desc, new_contrib,
            for_v: 0, against_v: 0, executed: false,
        });
        env.storage().instance().set(&Key::PropCount, &pid);
        env.events().publish((symbol_short!("propose"),), (pid, proposer));
        Ok(pid)
    }

    pub fn vote_proposal(env: Env, voter: Address, pid: u64, approve: bool) -> Result<(), Error> {
        voter.require_auth();
        if !env.storage().persistent().has(&Key::Member(voter.clone())) {
            return Err(Error::NotMember);
        }
        if env.storage().persistent().has(&Key::Voted(pid, voter.clone())) {
            return Err(Error::AlreadyVoted);
        }
        let cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;
        if care::CareClient::new(&env, &cfg.care).balance(&voter) <= 0 {
            return Err(Error::NoCare);
        }
        let mut p: Proposal = env.storage().persistent()
            .get(&Key::Proposal(pid)).ok_or(Error::NotFound)?;
        if p.executed { return Err(Error::AlreadyExec); }
        env.storage().persistent().set(&Key::Voted(pid, voter.clone()), &true);
        if approve { p.for_v += 1; } else { p.against_v += 1; }
        env.storage().persistent().set(&Key::Proposal(pid), &p);
        Ok(())
    }

    pub fn execute_proposal(env: Env, pid: u64) -> Result<(), Error> {
        let mut p: Proposal = env.storage().persistent()
            .get(&Key::Proposal(pid)).ok_or(Error::NotFound)?;
        if p.executed { return Err(Error::AlreadyExec); }
        if p.for_v <= p.against_v { return Err(Error::NotPassed); }
        let mut cfg = Self::cfg(&env).ok_or(Error::AlreadyInit)?;
        cfg.contrib = p.new_contrib;
        Self::save(&env, cfg);
        p.executed = true;
        env.storage().persistent().set(&Key::Proposal(pid), &p);
        env.events().publish((symbol_short!("exec"),), (pid,));
        Ok(())
    }

    pub fn get_proposal(env: Env, pid: u64) -> Option<Proposal> {
        env.storage().persistent().get(&Key::Proposal(pid))
    }
}

#[cfg(test)]
mod test;
