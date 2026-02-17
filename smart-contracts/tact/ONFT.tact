import "@stdlib/deploy";

// Omnichain NFT (ONFT) - Cross-chain NFT bridge
// Supports LayerZero and Wormhole protocols

const int error::onft_errors = 100;
const int error::unauthorized = 100;
const int error::invalid_chain = 101;
const int error::invalid_amount = 102;
const int error::bridge_failed = 103;
const int error::not_owner = 104;
const int error::already_bridged = 105;

const int error::general_errors = 200;
const int error::paused = 200;

const int CHAIN_TON: Int = 0;
const int CHAIN_ETHEREUM: Int = 1;
const int CHAIN_SOLANA: Int = 2;
const int CHAIN_BSC: Int = 3;
const int CHAIN_ARBITRUM: Int = 4;
const int CHAIN_OPTIMISM: Int = 5;
const int CHAIN_POLYGON: Int = 6;

const int PROTOCOL_LAYERZERO: Int = 1;
const int PROTOCOL_WORMHOLE: Int = 2;

struct ONFTMetadata {
    token_id: Int;
    owner: Address;
    uri: String;
    is_bridged: Bool;
    origin_chain: Int;
    current_chain: Int;
    bridge_protocol: Int;
    created_at: Int;
    bridged_at: Int?;
}

struct BridgeRequest {
    token_id: Int;
    from_chain: Int;
    to_chain: Int;
    protocol: Int;
    recipient: Address; // Recipient on destination chain
    gas_fee: Int;
    bridge_fee: Int;
    timestamp: Int;
}

trait Pausable {
    is_paused: Bool;
    owner: Address;

    virtual fun requireNotPaused(): Bool {
        if (self.is_paused) {
            throw(error::paused);
        }
        return true;
    }

    fun pause() {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }
        self.is_paused = true;
    }

    fun unpause() {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }
        self.is_paused = false;
    }
}

trait ReentrancyGuard {
    is_locked: Bool;

    virtual fun requireNotReentrant(): Bool {
        if (self.is_locked) {
            throw(error::general_errors);
        }
        self.is_locked = true;
        return true;
    }

    fun unlock() {
        self.is_locked = false;
    }
}

// Bridge Protocol Interface
trait BridgeProtocol {
    // LayerZero bridge
    fun bridgeLayerZero(request: BridgeRequest) {
        // Send message to LayerZero endpoint
        let lz_endpoint: Address = self.getLayerZeroEndpoint();
        send(Sender{
            to: lz_endpoint,
            value: request.gas_fee + ton("0.05"),
            mode: SendPayGasSeparately,
            body: comment("lz_bridge")
        });
    }

    // Wormhole bridge
    fun bridgeWormhole(request: BridgeRequest) {
        // Send message to Wormhole Guardian Network
        let wh_guardian: Address = self.getWormholeGuardian();
        send(Sender{
            to: wh_guardian,
            value: request.gas_fee + ton("0.05"),
            mode: SendPayGasSeparately,
            body: comment("wh_bridge")
        });
    }

    // Get LayerZero endpoint address (placeholder)
    virtual fun getLayerZeroEndpoint(): Address {
        return address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    }

    // Get Wormhole guardian address (placeholder)
    virtual fun getWormholeGuardian(): Address {
        return address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    }
}

@interface("org.ton.onft")
contract ONFT with Pausable, ReentrancyGuard, BridgeProtocol {
    owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    is_paused: Bool = false;
    is_locked: Bool = false;

    // Token storage
    token_owners: map<Int, Address>; // token_id -> owner
    token_uris: map<Int, String>; // token_id -> uri
    token_metadata: map<Int, ONFTMetadata>; // token_id -> metadata

    // Bridge state
    bridge_requests: map<Int, BridgeRequest>; // request_id -> request
    pending_bridges: map<Address, Int>; // address -> pending count
    bridge_fee_percent: Int = 500; // 5%

    // Token counter
    next_token_id: Int = 1;
    total_supply: Int = 0;

    // Supported chains
    supported_chains: map<Int, Bool>;

    // LayerZero and Wormhole configuration
    lz_endpoint: Address? = null;
    wh_guardian: Address? = null;

    init(admin: Address, lzEndpoint: Address?, whGuardian: Address?) {
        self.owner = admin;
        self.lz_endpoint = lzEndpoint;
        self.wh_guardian = whGuardian;

        // Initialize supported chains
        self.supported_chains.set(CHAIN_TON, true);
        self.supported_chains.set(CHAIN_ETHEREUM, true);
        self.supported_chains.set(CHAIN_SOLANA, true);
        self.supported_chains.set(CHAIN_BSC, true);
        self.supported_chains.set(CHAIN_ARBITRUM, true);
        self.supported_chains.set(CHAIN_OPTIMISM, true);
        self.supported_chains.set(CHAIN_POLYGON, true);
    }

    // Mint new ONFT (owner only)
    receive(msg: MintONFT) {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }

        let token_id: Int = self.next_token_id;

        let metadata: ONFTMetadata = ONFTMetadata{
            token_id: token_id,
            owner: msg.recipient,
            uri: msg.uri,
            is_bridged: false,
            origin_chain: CHAIN_TON,
            current_chain: CHAIN_TON,
            bridge_protocol: 0,
            created_at: now(),
            bridged_at: null
        };

        self.token_owners.set(token_id, msg.recipient);
        self.token_uris.set(token_id, msg.uri);
        self.token_metadata.set(token_id, metadata);

        self.next_token_id = token_id + 1;
        self.total_supply = self.total_supply + 1;
    }

    // Bridge ONFT to another chain
    receive(msg: BridgeONFT) {
        self.requireNotPaused();
        self.requireNotReentrant();

        let sender_addr: Address = sender();

        // Check if sender is token owner
        if (self.token_owners.get(msg.token_id) != sender_addr) {
            self.unlock();
            throw(error::not_owner);
        }

        // Check if chain is supported
        if (!self.supported_chains.exists(msg.to_chain)) {
            self.unlock();
            throw(error::invalid_chain);
        }

        // Check if token is already bridged
        let metadata: ONFTMetadata = self.token_metadata.get(msg.token_id)!!;
        if (metadata.is_bridged) {
            self.unlock();
            throw(error::already_bridged);
        }

        // Calculate fees
        let bridge_fee: Int = msg.amount * self.bridge_fee_percent / 10000;

        // Create bridge request
        let request: BridgeRequest = BridgeRequest{
            token_id: msg.token_id,
            from_chain: CHAIN_TON,
            to_chain: msg.to_chain,
            protocol: msg.protocol,
            recipient: msg.recipient,
            gas_fee: msg.gas_fee,
            bridge_fee: bridge_fee,
            timestamp: now()
        };

        let request_id: Int = msg.token_id * 1000000 + now();
        self.bridge_requests.set(request_id, request);

        // Execute bridge based on protocol
        if (msg.protocol == PROTOCOL_LAYERZERO) {
            self.bridgeLayerZero(request);
        } else if (msg.protocol == PROTOCOL_WORMHOLE) {
            self.bridgeWormhole(request);
        }

        // Mark token as bridged
        metadata.is_bridged = true;
        metadata.current_chain = msg.to_chain;
        metadata.bridge_protocol = msg.protocol;
        metadata.bridged_at = now();
        self.token_metadata.set(msg.token_id, metadata);

        // Remove ownership on current chain
        self.token_owners.del(msg.token_id);

        // Send bridge fee to owner
        if (bridge_fee > 0) {
            send(Sender{
                to: self.owner,
                value: bridge_fee,
                mode: SendPayGasSeparately,
                body: comment("bridge_fee")
            });
        }

        self.unlock();
    }

    // Receive bridged token from another chain
    receive(msg: ReceiveBridgedONFT) {
        self.requireNotPaused();
        self.requireNotReentrant();

        // Verify bridge message
        // In production, this would verify LayerZero or Wormhole signature
        let is_valid: Bool = self.verifyBridgeMessage(msg);

        if (!is_valid) {
            self.unlock();
            throw(error::bridge_failed);
        }

        // Check if token already exists
        if (self.token_owners.exists(msg.token_id)) {
            // Update existing token
            let metadata: ONFTMetadata = self.token_metadata.get(msg.token_id)!!;
            metadata.owner = msg.recipient;
            metadata.is_bridged = false;
            metadata.current_chain = CHAIN_TON;
            self.token_metadata.set(msg.token_id, metadata);
        } else {
            // Create new token
            let metadata: ONFTMetadata = ONFTMetadata{
                token_id: msg.token_id,
                owner: msg.recipient,
                uri: msg.uri,
                is_bridged: false,
                origin_chain: msg.from_chain,
                current_chain: CHAIN_TON,
                bridge_protocol: msg.protocol,
                created_at: now(),
                bridged_at: null
            };

            self.token_owners.set(msg.token_id, msg.recipient);
            self.token_uris.set(msg.token_id, msg.uri);
            self.token_metadata.set(msg.token_id, metadata);

            self.total_supply = self.total_supply + 1;
        }

        self.unlock();
    }

    // Transfer ONFT within same chain
    receive(msg: TransferONFT) {
        self.requireNotPaused();

        let sender_addr: Address = sender();

        // Check ownership
        if (self.token_owners.get(msg.token_id) != sender_addr) {
            throw(error::not_owner);
        }

        // Update ownership
        self.token_owners.set(msg.token_id, msg.recipient);
    }

    // Update bridge configuration (admin only)
    receive(msg: UpdateBridgeConfig) {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }

        self.bridge_fee_percent = msg.fee_percent;

        if (msg.lz_endpoint != null) {
            self.lz_endpoint = msg.lz_endpoint;
        }

        if (msg.wh_guardian != null) {
            self.wh_guardian = msg.wh_guardian;
        }
    }

    // Add/remove supported chain (admin only)
    receive(msg: UpdateSupportedChain) {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }

        if (msg.is_supported) {
            self.supported_chains.set(msg.chain_id, true);
        } else {
            self.supported_chains.del(msg.chain_id);
        }
    }

    // Verify bridge message (simplified - would use proper verification in production)
    fun verifyBridgeMessage(msg: ReceiveBridgedONFT): Bool {
        // In production, verify LayerZero or Wormhole signature
        // For now, just check basic validation
        return msg.token_id > 0 && msg.uri.length() > 0;
    }

    // Override getLayerZeroEndpoint
    override fun getLayerZeroEndpoint(): Address {
        if (self.lz_endpoint != null) {
            return self.lz_endpoint!!;
        }
        return address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    }

    // Override getWormholeGuardian
    override fun getWormholeGuardian(): Address {
        if (self.wh_guardian != null) {
            return self.wh_guardian!!;
        }
        return address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    }

    // Bounce handler
    receive bounced(msg: Any) {
        self.unlock();
    }

    // Getters
    get fun getOwner(tokenId: Int): Address? {
        return self.token_owners.get(tokenId);
    }

    get fun getURI(tokenId: Int): String? {
        return self.token_uris.get(tokenId);
    }

    get fun getMetadata(tokenId: Int): ONFTMetadata? {
        return self.token_metadata.get(tokenId);
    }

    get fun isChainSupported(chainId: Int): Bool {
        return self.supported_chains.exists(chainId);
    }

    get fun getTotalSupply(): Int {
        return self.total_supply;
    }

    get fun getNextTokenId(): Int {
        return self.next_token_id;
    }

    get fun getBridgeConfig(): (Int, Address?, Address?) {
        return (self.bridge_fee_percent, self.lz_endpoint, self.wh_guardian);
    }
}

// Message types
message MintONFT {
    recipient: Address;
    uri: String;
}

message BridgeONFT {
    token_id: Int;
    to_chain: Int;
    protocol: Int;
    recipient: Address;
    amount: Int;
    gas_fee: Int;
}

message ReceiveBridgedONFT {
    token_id: Int;
    from_chain: Int;
    protocol: Int;
    recipient: Address;
    uri: String;
}

message TransferONFT {
    token_id: Int;
    recipient: Address;
}

message UpdateBridgeConfig {
    fee_percent: Int;
    lz_endpoint: Address?;
    wh_guardian: Address?;
}

message UpdateSupportedChain {
    chain_id: Int;
    is_supported: Bool;
}
