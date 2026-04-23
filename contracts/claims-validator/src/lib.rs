//! Claims Validator — multi-sig approval.
//! submit() has NO require_auth — called by pool via inter-contract.
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Env, String};

#[contracterror] #[derive(Copy, Clone, Debug, PartialEq)]
pub enum Error { AlreadyInit=1, BadAmount=2, AlreadyVoted=3, NotFound=4, NotPending=5 }

#[contracttype] #[derive(Clone, PartialEq, Debug)]
pub enum Status { Pending, Approved, Rejected }

#[contracttype] #[derive(Clone)]
pub struct Claim { pub claimant: Address, pub amount: i128, pub desc: String,
                   pub status: Status, pub for_v: u32, pub against_v: u32 }

#[contracttype] #[derive(Clone)]
pub enum Key { Admin, MaxClaim, Threshold, Count, Claim(u64), Voted(u64, Address) }

#[contract] pub struct ClaimsValidator;

#[contractimpl]
impl ClaimsValidator {
    pub fn init(env: Env, admin: Address, max_claim: i128) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) { return Err(Error::AlreadyInit); }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::MaxClaim, &max_claim);
        env.storage().instance().set(&Key::Threshold, &2_u32);
        env.storage().instance().set(&Key::Count, &0_u64);
        Ok(())
    }
    pub fn admin(env: Env) -> Address { env.storage().instance().get(&Key::Admin).unwrap() }
    pub fn count(env: Env) -> u64 { env.storage().instance().get(&Key::Count).unwrap_or(0) }

    /// Called by pool via inter-contract — no require_auth
    pub fn submit(env: Env, claimant: Address, amount: i128, desc: String) -> Result<u64, Error> {
        let max: i128 = env.storage().instance().get(&Key::MaxClaim).unwrap_or(0);
        if amount <= 0 || amount > max { return Err(Error::BadAmount); }
        let n: u64 = env.storage().instance().get(&Key::Count).unwrap_or(0);
        let id = n + 1;
        env.storage().persistent().set(&Key::Claim(id), &Claim {
            claimant: claimant.clone(), amount, desc,
            status: Status::Pending, for_v: 0, against_v: 0,
        });
        env.storage().instance().set(&Key::Count, &id);
        env.events().publish((symbol_short!("submit"),), (id, claimant, amount));
        Ok(id)
    }

    pub fn vote(env: Env, voter: Address, id: u64, approve: bool) -> Result<(), Error> {
        voter.require_auth();
        if env.storage().persistent().has(&Key::Voted(id, voter.clone())) { return Err(Error::AlreadyVoted); }
        let mut c: Claim = env.storage().persistent().get(&Key::Claim(id)).ok_or(Error::NotFound)?;
        if c.status != Status::Pending { return Err(Error::NotPending); }
        env.storage().persistent().set(&Key::Voted(id, voter.clone()), &true);
        if approve { c.for_v += 1; } else { c.against_v += 1; }
        let t: u32 = env.storage().instance().get(&Key::Threshold).unwrap_or(2);
        if c.for_v >= t {
            c.status = Status::Approved;
            env.events().publish((symbol_short!("approved"),), (id, c.amount));
        } else if c.against_v >= t {
            c.status = Status::Rejected;
            env.events().publish((symbol_short!("rejected"),), (id,));
        }
        env.storage().persistent().set(&Key::Claim(id), &c);
        Ok(())
    }

    pub fn get(env: Env, id: u64) -> Option<Claim> {
        env.storage().persistent().get(&Key::Claim(id))
    }
    pub fn is_approved(env: Env, id: u64) -> bool {
        env.storage().persistent().get::<Key, Claim>(&Key::Claim(id))
            .map(|c| c.status == Status::Approved).unwrap_or(false)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};
    #[test]
    fn basics() {
        let env = Env::default(); env.mock_all_auths();
        let id = env.register(ClaimsValidator, ());
        let c = ClaimsValidatorClient::new(&env, &id);
        let admin = Address::generate(&env);
        c.init(&admin, &10_000_i128);
        let claimant = Address::generate(&env);
        let v1 = Address::generate(&env);
        let v2 = Address::generate(&env);
        let cid = c.submit(&claimant, &500_i128, &String::from_str(&env, "Hospital"));
        assert_eq!(cid, 1);
        c.vote(&v1, &cid, &true);
        assert!(!c.is_approved(&cid));
        c.vote(&v2, &cid, &true);
        assert!(c.is_approved(&cid));
        assert!(c.try_vote(&v1, &cid, &true).is_err()); // double vote
        assert!(c.try_submit(&claimant, &99999_i128, &String::from_str(&env, "x")).is_err());
    }
}
