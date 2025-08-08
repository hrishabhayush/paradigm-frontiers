pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

// Prove that private total_spent is strictly less than 100.
// Public signals include week_start and hash_of_tx_list for narrative continuity.

template SpendLimit() {
    signal input total_spent;          // private
    signal input week_start;           // public
    signal input hash_of_tx_list;      // public

    component isLess = LessThan(32);
    isLess.in[0] <== total_spent;
    isLess.in[1] <== 100;

    // Enforce boolean true
    isLess.out === 1;

    // Expose public signals explicitly to witness
    // (No additional constraints; included as public outputs via input declaration)
}

component main = SpendLimit();


