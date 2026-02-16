pragma circom 2.0.0;

// Merkle proof verification circuit
// Used for ZK proofs of NFT ownership and whitelist membership

include "../node_modules/circomlib/circuits/poseidon.circom";

template MerkleProof(depth) {
    signal input leaf;
    signal input root;
    signal input pathElements[depth];
    signal input pathIndices[depth]; // 0 for left, 1 for right
    signal output isValid;

    // Verify merkle path
    var currentHash = leaf;
    var idx = 0;

    for (var i = 0; i < depth; i++) {
        signal hash;
        signal inputLeft;
        signal inputRight;

        // Determine order based on path index
        inputLeft <== pathIndices[i] * pathElements[i] + (1 - pathIndices[i]) * currentHash;
        inputRight <== pathIndices[i] * currentHash + (1 - pathIndices[i]) * pathElements[i];

        // Compute hash
        component hasher = Poseidon(2);
        hasher.inputs[0] <== inputLeft;
        hasher.inputs[1] <== inputRight;

        currentHash = hasher.out;
        idx = i;
    }

    // Verify final hash matches root
    isValid <== root === currentHash;
}

// Merkle tree with proof generation (for testing)
template MerkleTree(depth) {
    signal input leaves[1 << depth];
    signal output root;

    // Build merkle tree
    signal internal_nodes[depth + 1][1 << depth];
    var current_size = 1 << depth;

    // Initialize leaves
    for (var i = 0; i < current_size; i++) {
        internal_nodes[0][i] <== leaves[i];
    }

    // Build tree level by level
    for (var level = 1; level <= depth; level++) {
        current_size = current_size / 2;
        for (var i = 0; i < current_size; i++) {
            component hasher = Poseidon(2);
            hasher.inputs[0] <== internal_nodes[level - 1][2 * i];
            hasher.inputs[1] <== internal_nodes[level - 1][2 * i + 1];
            internal_nodes[level][i] <== hasher.out;
        }
    }

    root <== internal_nodes[depth][0];
}

// Verify ownership proof
template OwnershipProof(depth) {
    signal input nft_address;
    signal input owner_address;
    signal input merkle_root;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output isValid;

    // Create leaf from NFT address and owner
    component leaf_hasher = Poseidon(2);
    leaf_hasher.inputs[0] <== nft_address;
    leaf_hasher.inputs[1] <== owner_address;

    signal leaf;
    leaf <== leaf_hasher.out;

    // Verify merkle proof
    component merkle_verify = MerkleProof(depth);
    merkle_verify.leaf <== leaf;
    merkle_verify.root <== merkle_root;
    for (var i = 0; i < depth; i++) {
        merkle_verify.pathElements[i] <== pathElements[i];
        merkle_verify.pathIndices[i] <== pathIndices[i];
    }

    isValid <== merkle_verify.isValid;
}

component main = MerkleProof(20);
