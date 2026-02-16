import "@stdlib/deploy";

const int error::offer_errors = 100;
const int error::unauthorized = 100;
const int error::offer_not_active = 101;
const int error::offer_expired = 102;
const int error::not_offer_maker = 103;
const int error::insufficient_payment = 104;
const int error::not_nft_owner = 105;
const int error::invalid_duration = 106;

const int error::general_errors = 200;
const int error::paused = 200;

const int MIN_OFFER_DURATION: Int = 3600; // 1 hour
const int MAX_OFFER_DURATION: Int = 2592000; // 30 days

struct OfferInfo {
    nft_item_address: Address;
    maker_address: Address; // Buyer making the offer
    amount: Int;
    expires_at: Int;
    is_active: Bool;
    is_accepted: Bool;
    is_cancelled: Bool;
    created_at: Int;
    accepted_at: Int?;
    cancelled_at: Int?;
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

@interface("org.ton.marketplace.offer")
contract Offer with Pausable, ReentrancyGuard {
    owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    is_paused: Bool = false;
    is_locked: Bool = false;

    offer_info: OfferInfo;

    nft_owner: Address; // Current owner of the NFT

    marketplace_fee_percent: Int = 250; // 2.5%
    marketplace_address: Address? = null;

    royalty_fee_percent: Int = 500; // 5%
    royalty_address: Address? = null;

    init(maker: Address, nftAddress: Address, nftOwner: Address, amount: Int,
         duration: Int, mktAddress: Address?, mktFeePercent: Int,
         royaltyAddr: Address?, royaltyFeePercent: Int) {

        self.owner = nftOwner; // NFT owner controls the offer
        self.nft_owner = nftOwner;

        self.marketplace_address = mktAddress;
        self.marketplace_fee_percent = mktFeePercent;
        self.royalty_address = royaltyAddr;
        self.royalty_fee_percent = royaltyFeePercent;

        // Validate duration
        if (duration < MIN_OFFER_DURATION || duration > MAX_OFFER_DURATION) {
            throw(error::invalid_duration);
        }

        let now_ts: Int = now();

        self.offer_info = OfferInfo{
            nft_item_address: nftAddress,
            maker_address: maker,
            amount: amount,
            expires_at: now_ts + duration,
            is_active: true,
            is_accepted: false,
            is_cancelled: false,
            created_at: now_ts,
            accepted_at: null,
            cancelled_at: null
        };
    }

    // Accept offer - Called by NFT owner
    receive(msg: AcceptOffer) {
        self.requireNotPaused();
        self.requireNotReentrant();

        if (!self.offer_info.is_active) {
            self.unlock();
            throw(error::offer_not_active);
        }

        if (sender() != self.nft_owner) {
            self.unlock();
            throw(error::not_nft_owner);
        }

        let current_time: Int = now();
        if (current_time > self.offer_info.expires_at) {
            self.offer_info.is_active = false;
            self.offer_info.is_cancelled = true;
            self.offer_info.cancelled_at = current_time;
            self.unlock();
            throw(error::offer_expired);
        }

        // Calculate fees
        let marketplace_fee: Int = self.offer_info.amount * self.marketplace_fee_percent / 10000;
        let royalty_fee: Int = self.offer_info.amount * self.royalty_fee_percent / 10000;
        let owner_amount: Int = self.offer_info.amount - marketplace_fee - royalty_fee;

        // Send marketplace fee
        if (self.marketplace_address != null) {
            send(Sender{
                to: self.marketplace_address!!,
                value: marketplace_fee,
                mode: SendPayGasSeparately,
                body: comment("marketplace_fee")
            });
        }

        // Send royalty fee
        if (self.royalty_address != null) {
            send(Sender{
                to: self.royalty_address!!,
                value: royalty_fee,
                mode: SendPayGasSeparately,
                body: comment("royalty_fee")
            });
        }

        // Send remaining to NFT owner
        send(Sender{
            to: self.nft_owner,
            value: owner_amount,
            mode: SendPayGasSeparately,
            body: comment("nft_owner_payment")
        });

        // Transfer NFT to offer maker (buyer)
        send(Sender{
            to: self.offer_info.nft_item_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_to_buyer")
        });

        // Mark offer as accepted
        self.offer_info.is_active = false;
        self.offer_info.is_accepted = true;
        self.offer_info.accepted_at = current_time;

        // Update owner (NFT transferred to buyer)
        self.nft_owner = self.offer_info.maker_address;

        self.unlock();
    }

    // Cancel offer - Can be called by offer maker or NFT owner
    receive(msg: CancelOffer) {
        self.requireNotPaused();

        if (!self.offer_info.is_active) {
            throw(error::offer_not_active);
        }

        let is_maker: Bool = sender() == self.offer_info.maker_address;
        let is_owner: Bool = sender() == self.nft_owner;

        if (!is_maker && !is_owner) {
            throw(error::unauthorized);
        }

        // Refund offer amount to maker
        send(Sender{
            to: self.offer_info.maker_address,
            value: self.offer_info.amount,
            mode: SendPayGasSeparately,
            body: comment("offer_refund")
        });

        // Mark offer as cancelled
        let current_time: Int = now();
        self.offer_info.is_active = false;
        self.offer_info.is_cancelled = true;
        self.offer_info.cancelled_at = current_time;
    }

    // Update NFT owner (called when NFT is transferred outside of offer)
    receive(msg: UpdateOwner) {
        if (sender() != self.nft_owner && sender() != self.offer_info.nft_item_address) {
            throw(error::unauthorized);
        }

        self.nft_owner = msg.new_owner;
    }

    // Check expiry and auto-cancel
    receive(msg: CheckExpiry) {
        let current_time: Int = now();
        if (current_time > self.offer_info.expires_at && self.offer_info.is_active) {
            // Auto-expire the offer and refund maker
            send(Sender{
                to: self.offer_info.maker_address,
                value: self.offer_info.amount,
                mode: SendPayGasSeparately,
                body: comment("expired_offer_refund")
            });

            self.offer_info.is_active = false;
            self.offer_info.is_cancelled = true;
            self.offer_info.cancelled_at = current_time;
        }
    }

    // Update offer settings (marketplace admin only)
    receive(msg: UpdateFees) {
        if (sender() != self.owner) {
            throw(error::unauthorized);
        }

        self.marketplace_fee_percent = msg.marketplace_fee;
        self.marketplace_address = msg.marketplace_address;
        self.royalty_fee_percent = msg.royalty_fee;
        self.royalty_address = msg.royalty_address;
    }

    // Bounce handler
    receive bounced(msg: Any) {
        self.unlock();
    }

    // Getters
    get fun getOfferInfo(): OfferInfo {
        return self.offer_info;
    }

    get fun isActive(): Bool {
        return self.offer_info.is_active;
    }

    get fun isExpired(): Bool {
        return now() > self.offer_info.expires_at;
    }

    get fun getTimeRemaining(): Int {
        let remaining: Int = self.offer_info.expires_at - now();
        if (remaining < 0) {
            return 0;
        }
        return remaining;
    }

    get fun getOfferMaker(): Address {
        return self.offer_info.maker_address;
    }

    get fun getOfferAmount(): Int {
        return self.offer_info.amount;
    }

    get fun getNFTOwner(): Address {
        return self.nft_owner;
    }
}

// Message types
message AcceptOffer {}

message CancelOffer {}

message UpdateOwner {
    new_owner: Address;
}

message CheckExpiry {}

message UpdateFees {
    marketplace_fee: Int;
    marketplace_address: Address?;
    royalty_fee: Int;
    royalty_address: Address?;
}
