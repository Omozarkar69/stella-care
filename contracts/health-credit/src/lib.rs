//! HEALTH Credit — non-transferable coverage credits.
//! issue() and spend() have NO require_auth — called by pool via inter-contract.
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Env};

#[contracterror] #[derive(Copy, Clone, Debug, PartialEq)]
pub enum Error { AlreadyInit=1, BadAmount=2, LowCredits=3 }

#[contracttype] #[derive(Clone)]
pub enum Key { Admin, Credits(Address), Total }

#[contract] pub struct HealthCredit;

#[contractimpl]
impl HealthCredit {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) { return Err(Error::AlreadyInit); }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Total, &0_i128);
        Ok(())
    }
    pub fn admin(env: Env) -> Address { env.storage().instance().get(&Key::Admin).unwrap() }
    pub fn credits(env: Env, of: Address) -> i128 { env.storage().persistent().get(&Key::Credits(of)).unwrap_or(0) }
    pub fn total(env: Env) -> i128 { env.storage().instance().get(&Key::Total).unwrap_or(0) }

    /// Called by pool via inter-contract — no require_auth
    pub fn issue(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 { return Err(Error::BadAmount); }
        let b: i128 = env.storage().persistent().get(&Key::Credits(to.clone())).unwrap_or(0);
        env.storage().persistent().set(&Key::Credits(to.clone()), &(b + amount));
        let t: i128 = env.storage().instance().get(&Key::Total).unwrap_or(0);
        env.storage().instance().set(&Key::Total, &(t + amount));
        env.events().publish((symbol_short!("issue"),), (to, amount));
        Ok(())
    }
    /// Called by pool via inter-contract — no require_auth
    pub fn spend(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 { return Err(Error::BadAmount); }
        let b: i128 = env.storage().persistent().get(&Key::Credits(from.clone())).unwrap_or(0);
        if b < amount { return Err(Error::LowCredits); }
        env.storage().persistent().set(&Key::Credits(from.clone()), &(b - amount));
        env.events().publish((symbol_short!("spend"),), (from, amount));
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    #[test]
    fn basics() {
        let env = Env::default(); env.mock_all_auths();
        let id = env.register(HealthCredit, ());
        let c = HealthCreditClient::new(&env, &id);
        let admin = Address::generate(&env);
        let user  = Address::generate(&env);
        c.init(&admin);
        c.issue(&user, &500);
        assert_eq!(c.credits(&user), 500);
        c.spend(&user, &200);
        assert_eq!(c.credits(&user), 300);
        assert!(c.try_spend(&user, &9999).is_err());
    }
}
