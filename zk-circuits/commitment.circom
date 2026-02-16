pragma circom 2.0.0;

// Pedersen commitment circuit for sealed bid auctions
// Computes commitment = H(bid_amount, salt, bidder_address)

include "../node_modules/circomlib/circuits/pedersen.circom";

template Commitment() {
    signal input bid_amount;
    signal input salt;
    signal input bidder_address;
    signal output commitment;
    signal output nullifier;

    // Compute Pedersen commitment
    commitment <== Pedersen(3)([bid_amount, salt, bidder_address]);

    // Compute nullifier for preventing double-spending
    nullifier <== Pedersen(2)([bid_amount, bidder_address]);
}

component main {public [bidder_address]} = Commitment();
