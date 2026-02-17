#!/bin/bash

# ZK Circuit Compilation Script
# Compiles Circom circuits and generates proving/verification keys

set -e

# Load environment variables
if [ -f circuit.env ]; then
    export $(cat circuit.env | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create build directories
print_info "Creating build directories..."
mkdir -p ${BUILD_DIR}
mkdir -p ${PROVING_KEY_DIR}
mkdir -p ${VERIFICATION_KEY_DIR}
mkdir -p ${WASM_DIR}
mkdir -p ${CONTRACTS_DIR}

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    print_error "circom is not installed. Please install it first."
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    print_error "snarkjs is not installed. Please install it first."
    exit 1
fi

# Function to compile a circuit
compile_circuit() {
    local circuit_name=$1
    local circuit_file="${circuit_name}.circom"

    print_info "Compiling circuit: ${circuit_name}"

    if [ ! -f "${circuit_file}" ]; then
        print_error "Circuit file not found: ${circuit_file}"
        return 1
    fi

    # Compile circuit to WASM
    print_info "  -> Compiling to WASM..."
    circom ${circuit_file} \
        --wasm \
        --output ${WASM_DIR} \
        --O${OPTIMIZATION_LEVEL}

    if [ $? -ne 0 ]; then
        print_error "Failed to compile ${circuit_name} to WASM"
        return 1
    fi

    # Compile circuit to R1CS
    print_info "  -> Compiling to R1CS..."
    circom ${circuit_file} \
        --r1cs \
        --output ${BUILD_DIR} \
        --O${OPTIMIZATION_LEVEL}

    if [ $? -ne 0 ]; then
        print_error "Failed to compile ${circuit_name} to R1CS"
        return 1
    fi

    print_info "  -> Successfully compiled ${circuit_name}"
    return 0
}

# Function to generate keys
generate_keys() {
    local circuit_name=$1
    local r1cs_file="${BUILD_DIR}/${circuit_name}.r1cs"
    local wasm_file="${WASM_DIR}/${circuit_name}_js/${circuit_name}.wasm"
    local ptau_file="${PTAU_FILE}"

    print_info "Generating keys for: ${circuit_name}"

    if [ ! -f "${r1cs_file}" ]; then
        print_error "R1CS file not found: ${r1cs_file}"
        return 1
    fi

    # Download Powers of Tau if not exists
    if [ ! -f "${ptau_file}" ]; then
        print_warn "Powers of Tau file not found. Downloading..."
        wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau -O ${ptau_file}
    fi

    # Start a new powers of tau ceremony if needed
    if [ ! -f "${ptau_file}" ]; then
        print_warn "Generating new Powers of Tau (this may take a while)..."
        snarkjs powersoftau new bn128 20 ${ptau_file} -e
    fi

    # Contribute to ceremony
    print_info "  -> Contributing to ceremony..."
    snarkjs powersoftau contribute ${ptau_file} ${BUILD_DIR}/contribution_${circuit_name}.ptau -n="Contribution for ${circuit_name}" -e

    # Prepare phase 2
    print_info "  -> Preparing phase 2..."
    snarkjs powersoftau prepare phase2 ${ptau_file} ${BUILD_DIR}/pot20_final.ptau

    # Generate proving key
    print_info "  -> Generating proving key..."
    snarkjs groth16 setup ${r1cs_file} ${BUILD_DIR}/pot20_final.ptau ${PROVING_KEY_DIR}/${circuit_name}_0000.zkey

    # Contribute to ceremony (second round)
    print_info "  -> Second contribution..."
    snarkjs zkey contribute ${PROVING_KEY_DIR}/${circuit_name}_0000.zkey ${PROVING_KEY_DIR}/${circuit_name}_final.zkey -n="Second contribution" -e

    # Export verification key
    print_info "  -> Exporting verification key..."
    snarkjs zkey export verificationkey ${PROVING_KEY_DIR}/${circuit_name}_final.zkey ${VERIFICATION_KEY_DIR}/${circuit_name}_verification_key.json

    # Generate Solidity verifier
    print_info "  -> Generating Solidity verifier..."
    snarkjs zkey export solidityverifier ${PROVING_KEY_DIR}/${circuit_name}_final.zkey ${CONTRACTS_DIR}/${circuit_name}Verifier.sol

    print_info "  -> Successfully generated keys for ${circuit_name}"
    return 0
}

# Function to print circuit info
print_info() {
    local circuit_name=$1
    local r1cs_file="${BUILD_DIR}/${circuit_name}.r1cs"

    if [ -f "${r1cs_file}" ]; then
        print_info "Circuit info for: ${circuit_name}"
        snarkjs r1cs info ${r1cs_file}
    fi
}

# Main compilation pipeline
print_info "Starting ZK circuit compilation pipeline..."
echo ""

# Compile commitment circuit
print_info "=== Commitment Circuit ==="
compile_circuit "commitment"
print_info "=== Commitment Circuit Completed ==="
echo ""

# Compile verifyBid circuit
print_info "=== Verify Bid Circuit ==="
compile_circuit "verifyBid"
print_info "=== Verify Bid Circuit Completed ==="
echo ""

# Compile merkleProof circuit
print_info "=== Merkle Proof Circuit ==="
compile_circuit "merkleProof"
print_info "=== Merkle Proof Circuit Completed ==="
echo ""

# Generate keys for all circuits
print_info "=== Key Generation ==="
generate_keys "commitment"
generate_keys "verifyBid"
generate_keys "merkleProof"
print_info "=== Key Generation Completed ==="
echo ""

# Print circuit information
print_info "=== Circuit Information ==="
print_circuit_info "commitment"
print_circuit_info "verifyBid"
print_circuit_info "merkleProof"
print_info "=== Circuit Information Completed ==="
echo ""

print_info "All circuits compiled successfully!"
print_info "Build artifacts location:"
print_info "  - R1CS files: ${BUILD_DIR}"
print_info "  - WASM files: ${WASM_DIR}"
print_info "  - Proving keys: ${PROVING_KEY_DIR}"
print_info "  - Verification keys: ${VERIFICATION_KEY_DIR}"
print_info "  - Solidity contracts: ${CONTRACTS_DIR}"
