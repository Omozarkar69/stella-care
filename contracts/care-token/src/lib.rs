//! CARE Token — governance token, minted by the pool via inter-contract call.
//! mint() has NO require_auth — only the pool (admin) calls it.
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Env, String};

#[contracterror] #[derive(Copy, Clone, Debug, PartialEq)]
pub enum Error { AlreadyInit=1, BadAmount=2, LowBalance=3, LowAllowance=4 }

#[contracttype] #[derive(Clone)]
pub enum Key { Admin, Supply, Bal(Address), Allow(Address,Address) }

#[contract] pub struct CareToken;

#[contractimpl]
impl CareToken {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) { return Err(Error::AlreadyInit); }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Supply, &0_i128);
        Ok(())
    }
    pub fn admin(env: Env) -> Address { env.storage().instance().get(&Key::Admin).unwrap() }
    pub fn name(_e: Env) -> String { String::from_str(&_e, "StellarCare Token") }
    pub fn symbol(_e: Env) -> String { String::from_str(&_e, "CARE") }
    pub fn decimals(_e: Env) -> u32 { 7 }
    pub fn total_supply(env: Env) -> i128 { env.storage().instance().get(&Key::Supply).unwrap_or(0) }
    pub fn balance(env: Env, of: Address) -> i128 { env.storage().persistent().get(&Key::Bal(of)).unwrap_or(0) }

    /// Called by pool via inter-contract — no require_auth needed
    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 { return Err(Error::BadAmount); }
        let b: i128 = env.storage().persistent().get(&Key::Bal(to.clone())).unwrap_or(0);
        env.storage().persistent().set(&Key::Bal(to.clone()), &(b + amount));
        let s: i128 = env.storage().instance().get(&Key::Supply).unwrap_or(0);
        env.storage().instance().set(&Key::Supply, &(s + amount));
        env.events().publish((symbol_short!("mint"),), (to, amount));
        Ok(())
    }
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 { return Err(Error::BadAmount); }
        let fb: i128 = env.storage().persistent().get(&Key::Bal(from.clone())).unwrap_or(0);
        if fb < amount { return Err(Error::LowBalance); }
        let tb: i128 = env.storage().persistent().get(&Key::Bal(to.clone())).unwrap_or(0);
        env.storage().persistent().set(&Key::Bal(from.clone()), &(fb - amount));
        env.storage().persistent().set(&Key::Bal(to.clone()), &(tb + amount));
        env.events().publish((symbol_short!("xfer"),), (from, to, amount));
        Ok(())
    }
    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 { return Err(Error::BadAmount); }
        let b: i128 = env.storage().persistent().get(&Key::Bal(from.clone())).unwrap_or(0);
        if b < amount { return Err(Error::LowBalance); }
        env.storage().persistent().set(&Key::Bal(from.clone()), &(b - amount));
        let s: i128 = env.storage().instance().get(&Key::Supply).unwrap_or(0);
        env.storage().instance().set(&Key::Supply, &(s - amount));
        Ok(())
    }
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        from.require_auth();
        env.storage().persistent().set(&Key::Allow(from, spender), &amount);
    }
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage().persistent().get(&Key::Allow(from, spender)).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    #[test]
    fn basics() {
        let env = Env::default(); env.mock_all_auths();
        let id = env.register(CareToken, ());
        let c = CareTokenClient::new(&env, &id);
        let admin = Address::generate(&env);
        let user  = Address::generate(&env);
        c.init(&admin);
        c.mint(&user, &1000);
        assert_eq!(c.balance(&user), 1000);
        assert_eq!(c.total_supply(), 1000);
        c.burn(&user, &200);
        assert_eq!(c.balance(&user), 800);
        let u2 = Address::generate(&env);
        c.transfer(&user, &u2, &300);
        assert_eq!(c.balance(&u2), 300);
        assert!(c.try_mint(&user, &0).is_err());
    }
}
