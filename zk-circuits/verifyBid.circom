pragma circom 2.0.0;

// Verify bid circuit for sealed bid auctions
// Verifies that:
// 1. Bid amount is within valid range
// 2. Commitment matches the revealed bid
// 3. Bidder matches the commitment
// 4. Prevents replay attacks using nullifiers

include "./commitment.circom";

// Range proof circuit (simplified)
template RangeProof(n) {
    signal input in;
    signal input out[n];
    signal output range_valid;

    // Decompose input into bits
    var lc = 0;
    for (var i = 0; i < n; i++) {
        out[i] <== in >> i;
        out[i] * (out[i] - 1) === 0; // Ensure bit is 0 or 1
        lc += out[i] * (1 << i);
    }

    range_valid <== in - lc === 0;
}

// Merkle proof verification (simplified)
template MerkleProof(depth) {
    signal input leaf;
    signal input root;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output proofValid;

    var current = leaf;
    for (var i = 0; i < depth; i++) {
        signal hash;
        if (pathIndices[i] == 0) {
            hash <== Poseidon(2)([current, pathElements[i]]);
        } else {
            hash <== Poseidon(2)([pathElements[i], current]);
        }
        current = hash;
    }

    proofValid <== root === current;
}

template VerifyBid() {
    signal input revealed_bid;
    signal input revealed_salt;
    signal input bidder_address;
    signal input commitment;
    signal input nullifier;
    signal input min_bid;
    signal input max_bid;

    signal output bid_valid;
    signal output commitment_matches;
    signal output range_valid;

    // Recompute commitment from revealed values
    component recomputed_commitment = Commitment();
    recomputed_commitment.bid_amount <== revealed_bid;
    recomputed_commitment.salt <== revealed_salt;
    recomputed_commitment.bidder_address <== bidder_address;

    // Verify commitment matches
    commitment_matches <== commitment === recomputed_commitment.commitment;

    // Verify nullifier prevents double-spending
    signal nullifier_valid;
    nullifier_valid <== nullifier === recomputed_commitment.nullifier;

    // Verify bid is within valid range
    component range_check = RangeProof(64);
    range_check.in <== revealed_bid;

    signal min_valid;
    min_valid <== range_check.out >= min_bid;

    signal max_valid;
    max_valid <== range_check.out <= max_bid;

    range_valid <== min_valid * max_valid;

    // All conditions must be satisfied
    bid_valid <== commitment_matches * nullifier_valid * range_valid;
}

component main = VerifyBid();
