#![cfg(test)]
extern crate std;
use super::*;
use care_token::{CareToken, CareTokenClient};
use claims_validator::{ClaimsValidator, ClaimsValidatorClient};
use health_credit::{HealthCredit, HealthCreditClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, HealthPoolClient<'static>, CareTokenClient<'static>,
               HealthCreditClient<'static>, ClaimsValidatorClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin   = Address::generate(&env);
    let care_id = env.register(CareToken, ());
    let hc_id   = env.register(HealthCredit, ());
    let cv_id   = env.register(ClaimsValidator, ());
    let pool_id = env.register(HealthPool, ());
    let care = CareTokenClient::new(&env, &care_id);
    let hc   = HealthCreditClient::new(&env, &hc_id);
    let cv   = ClaimsValidatorClient::new(&env, &cv_id);
    let pool = HealthPoolClient::new(&env, &pool_id);
    care.init(&pool_id);
    hc.init(&admin);
    cv.init(&admin, &10_000_i128);
    pool.init(&admin, &care_id, &hc_id, &cv_id, &100_i128, &500_i128);
    (env, pool, care, hc, cv, admin)
}

#[test]
fn test_join() {
    let (env, pool, care, hc, _, _) = setup();
    let m = Address::generate(&env);
    pool.join(&m);
    assert!(pool.is_member(&m));
    assert_eq!(pool.member_count(), 1);
    assert_eq!(pool.total_funds(), 100);
    assert_eq!(hc.credits(&m), 500);
    assert_eq!(care.balance(&m), 100);
}

#[test]
fn test_contribute() {
    let (env, pool, care, hc, _, _) = setup();
    let m = Address::generate(&env);
    pool.join(&m);
    pool.contribute(&m);
    assert_eq!(hc.credits(&m), 1000);
    assert_eq!(care.balance(&m), 110);
    assert_eq!(pool.total_funds(), 200);
}

#[test]
fn test_claim_flow() {
    let (env, pool, _, hc, cv, _) = setup();
    let m  = Address::generate(&env);
    let v1 = Address::generate(&env);
    let v2 = Address::generate(&env);
    pool.join(&m);
    let cid = pool.submit_claim(&m, &200_i128, &String::from_str(&env, "Hospital"));
    assert_eq!(cid, 1);
    cv.vote(&v1, &cid, &true);
    cv.vote(&v2, &cid, &true);
    assert!(cv.is_approved(&cid));
    pool.disburse(&cid, &m);
    assert_eq!(hc.credits(&m), 300);
}

#[test]
fn test_governance() {
    let (env, pool, _, _, _, _) = setup();
    let m1 = Address::generate(&env);
    let m2 = Address::generate(&env);
    pool.join(&m1);
    pool.join(&m2);
    let pid = pool.create_proposal(&m1, &String::from_str(&env, "Raise"), &150_i128);
    pool.vote_proposal(&m1, &pid, &true);
    pool.vote_proposal(&m2, &pid, &true);
    pool.execute_proposal(&pid);
    assert_eq!(pool.config().unwrap().contrib, 150);
}

#[test]
fn test_errors() {
    let (env, pool, _, _, _, _) = setup();
    let m = Address::generate(&env);
    pool.join(&m);
    assert!(pool.try_join(&m).is_err());
    let s = Address::generate(&env);
    assert!(pool.try_submit_claim(&s, &100_i128, &String::from_str(&env, "x")).is_err());
}
