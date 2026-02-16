#!/bin/bash

# ZK Circuit Trusted Setup Script
# Performs multi-party computation for trusted setup ceremony

set -e

# Load environment variables
if [ -f ../circuit.env ]; then
    export $(cat ../circuit.env | grep -v '^#' | xargs)
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check dependencies
if ! command -v snarkjs &> /dev/null; then
    print_error "snarkjs is not installed"
    exit 1
fi

CIRCUIT_NAME=${1:-commitment}
BUILD_DIR=../build
PROVING_KEY_DIR=../keys

print_info "Starting trusted setup ceremony for: ${CIRCUIT_NAME}"
echo ""

# Phase 1: Powers of Tau
print_step "Phase 1: Powers of Tau Ceremony"
print_info "This is a universal setup that can be used for any circuit"

# Check if Powers of Tau exists
if [ ! -f "${PTAU_FILE}" ]; then
    print_info "Downloading Powers of Tau..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau -O ${PTAU_FILE}
    if [ $? -ne 0 ]; then
        print_error "Failed to download Powers of Tau"
        exit 1
    fi
    print_info "Successfully downloaded Powers of Tau"
else
    print_info "Using existing Powers of Tau: ${PTAU_FILE}"
fi
echo ""

# Phase 2: Circuit-specific setup
print_step "Phase 2: Circuit-Specific Setup"

R1CS_FILE="${BUILD_DIR}/${CIRCUIT_NAME}.r1cs"
if [ ! -f "${R1CS_FILE}" ]; then
    print_error "R1CS file not found. Please compile the circuit first."
    exit 1
fi

print_info "Loading circuit from: ${R1CS_FILE}"
echo ""

# Contribute to ceremony (multiple parties can contribute)
print_step "Phase 3: Multi-Party Contributions"

# Contribution 1
print_info "Contribution 1/3..."
snarkjs powersoftau contribute ${PTAU_FILE} ${BUILD_DIR}/pot20_round1.ptau \
    -n="First contribution" \
    -e \
    -v

if [ $? -ne 0 ]; then
    print_error "Contribution 1 failed"
    exit 1
fi

# Contribution 2
print_info "Contribution 2/3..."
snarkjs powersoftau contribute ${BUILD_DIR}/pot20_round1.ptau ${BUILD_DIR}/pot20_round2.ptau \
    -n="Second contribution" \
    -e \
    -v

if [ $? -ne 0 ]; then
    print_error "Contribution 2 failed"
    exit 1
fi

# Contribution 3
print_info "Contribution 3/3..."
snarkjs powersoftau contribute ${BUILD_DIR}/pot20_round2.ptau ${BUILD_DIR}/pot20_round3.ptau \
    -n="Third contribution" \
    -e \
    -v

if [ $? -ne 0 ]; then
    print_error "Contribution 3 failed"
    exit 1
fi
echo ""

# Prepare phase 2
print_step "Phase 4: Prepare Phase 2"
print_info "Preparing circuit for Groth16..."

snarkjs powersoftau prepare phase2 ${BUILD_DIR}/pot20_round3.ptau ${BUILD_DIR}/pot20_final.ptau

if [ $? -ne 0 ]; then
    print_error "Failed to prepare phase 2"
    exit 1
fi
print_info "Phase 2 preparation complete"
echo ""

# Generate proving key
print_step "Phase 5: Generate Proving Key"
print_info "This step requires the circuit R1CS file..."

snarkjs groth16 setup ${R1CS_FILE} ${BUILD_DIR}/pot20_final.ptau \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_0000.zkey

if [ $? -ne 0 ]; then
    print_error "Failed to generate proving key"
    exit 1
fi
print_info "Proving key generated"
echo ""

# Verify setup
print_step "Phase 6: Verify Setup"
print_info "Verifying the ceremony was performed correctly..."

snarkjs zkey verify ${R1CS_FILE} ${BUILD_DIR}/pot20_final.ptau \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_0000.zkey

if [ $? -ne 0 ]; then
    print_error "Setup verification failed!"
    print_error "This is critical - the setup must be redone!"
    exit 1
fi
print_info "Setup verified successfully"
echo ""

# Contribute to final zkey
print_step "Phase 7: Final Contribution"
print_info "Adding final contribution to proving key..."

snarkjs zkey contribute ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_0000.zkey \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_final.zkey \
    -n="Final contribution" \
    -e \
    -v

if [ $? -ne 0 ]; then
    print_error "Final contribution failed"
    exit 1
fi
print_info "Final contribution complete"
echo ""

# Export verification key
print_step "Phase 8: Export Verification Key"
print_info "Exporting verification key for contract integration..."

snarkjs zkey export verificationkey ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_final.zkey \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_verification_key.json

if [ $? -ne 0 ]; then
    print_error "Failed to export verification key"
    exit 1
fi
print_info "Verification key exported"
echo ""

# Generate Solidity verifier
print_step "Phase 9: Generate Solidity Verifier"
print_info "Generating Solidity contract for on-chain verification..."

snarkjs zkey export solidityverifier ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_final.zkey \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_verifier.sol

if [ $? -ne 0 ]; then
    print_error "Failed to generate Solidity verifier"
    exit 1
fi
print_info "Solidity verifier generated"
echo ""

# Export JSON verification key for Tact/other chains
print_step "Phase 10: Export JSON Verification Key"
print_info "Exporting JSON verification key for cross-chain verification..."

snarkjs zkey export jsonverificationkey ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_final.zkey \
    ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_verification_key.json

if [ $? -ne 0 ]; then
    print_warn "Failed to export JSON verification key (may not be supported)"
else
    print_info "JSON verification key exported"
fi
echo ""

# Generate witness calculator
print_step "Phase 11: Generate Witness Calculator"
print_info "Generating witness calculator for proof generation..."

WASM_FILE="${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
if [ -f "${WASM_FILE}" ]; then
    # Generate witness calculator (optional)
    if command -v wasm2c &> /dev/null; then
        wasm2c ${WASM_FILE} -o ${BUILD_DIR}/${CIRCUIT_NAME}_witness.c
        print_info "Witness calculator generated"
    else
        print_warn "wasm2c not found, skipping witness calculator"
    fi
else
    print_warn "WASM file not found, skipping witness calculator"
fi
echo ""

# Summary
print_info "=== Trusted Setup Complete ==="
echo ""
print_info "Generated files:"
print_info "  - Proving key: ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_final.zkey"
print_info "  - Verification key: ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_verification_key.json"
print_info "  - Solidity verifier: ${PROVING_KEY_DIR}/${CIRCUIT_NAME}_verifier.sol"
print_info "  - Powers of Tau: ${BUILD_DIR}/pot20_final.ptau"
echo ""
print_warn "IMPORTANT SECURITY NOTES:"
print_warn "1. Save the 'toxic waste' (bezier coefficients) securely"
print_warn "2. Never share the proving key private data"
print_warn "3. The verification key is safe to share publicly"
print_warn "4. Consider running a multi-party ceremony with many contributors"
print_warn "5. Keep the final .zkey file secure - it can be used to generate fake proofs"
echo ""
print_info "Next steps:"
print_info "1. Deploy the Solidity verifier to your blockchain"
print_info "2. Integrate the verification key with your smart contracts"
print_info "3. Use the proving key to generate proofs on the client/server"
print_info "4. Verify proofs on-chain using the verifier contract"
