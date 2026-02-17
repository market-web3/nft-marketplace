import "@stdlib/deploy";

const int error::auction_errors = 100;
const int error::unauthorized = 100;
const int error::auction_not_active = 101;
const int error::auction_not_started = 102;
const int error::auction_already_ended = 103;
const int error::bid_too_low = 104;
const int error::not_highest_bidder = 105;
const int error::invalid_time = 106;
const int error::already_claimed = 107;

const int error::general_errors = 200;
const int error::paused = 200;

const int DEFAULT_MIN_BID_INCREMENT: Int = 500; // 5%
const int DEFAULT_EXTENSION_TIME: Int = 300; // 5 minutes
const int DEFAULT_DURATION: Int = 86400; // 24 hours

struct AuctionInfo {
    nft_item_address: Address;
    seller_address: Address;
    start_price: Int;
    current_bid: Int;
    highest_bidder: Address?;
    start_time: Int;
    end_time: Int;
    min_bid_increment: Int; // in basis points (100 = 1%)
    extension_time: Int; // in seconds
    is_active: Bool;
    winner_claimed: Bool;
    created_at: Int;
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

@interface("org.ton.marketplace.auction")
contract Auction with Pausable, ReentrancyGuard {
    owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    is_paused: Bool = false;
    is_locked: Bool = false;

    auction_info: AuctionInfo;
    marketplace_fee_percent: Int = 250; // 2.5%
    marketplace_address: Address? = null;

    init(seller: Address, nftAddress: Address, startPrice: Int,
         minBidIncrement: Int, extensionTime: Int, duration: Int,
         mktAddress: Address?, mktFeePercent: Int) {

        self.owner = seller;
        self.marketplace_address = mktAddress;
        self.marketplace_fee_percent = mktFeePercent;

        let now_ts: Int = now();
        let increment: Int = minBidIncrement;
        if (increment == 0) {
            increment = DEFAULT_MIN_BID_INCREMENT;
        }

        let extension: Int = extensionTime;
        if (extension == 0) {
            extension = DEFAULT_EXTENSION_TIME;
        }

        let auction_duration: Int = duration;
        if (auction_duration == 0) {
            auction_duration = DEFAULT_DURATION;
        }

        self.auction_info = AuctionInfo{
            nft_item_address: nftAddress,
            seller_address: seller,
            start_price: startPrice,
            current_bid: startPrice,
            highest_bidder: null,
            start_time: now_ts,
            end_time: now_ts + auction_duration,
            min_bid_increment: increment,
            extension_time: extension,
            is_active: true,
            winner_claimed: false,
            created_at: now_ts
        };
    }

    receive(msg: PlaceBid) {
        self.requireNotPaused();
        self.requireNotReentrant();

        if (!self.auction_info.is_active) {
            self.unlock();
            throw(error::auction_not_active);
        }

        let current_time: Int = now();
        if (current_time < self.auction_info.start_time) {
            self.unlock();
            throw(error::auction_not_started);
        }

        if (current_time >= self.auction_info.end_time) {
            self.unlock();
            throw(error::auction_already_ended);
        }

        // Calculate minimum bid
        let min_increment_amount: Int = self.auction_info.current_bid *
            self.auction_info.min_bid_increment / 10000;
        let min_bid: Int = self.auction_info.current_bid + min_increment_amount;

        if (msg.amount < min_bid) {
            self.unlock();
            throw(error::bid_too_low);
        }

        // Refund previous highest bidder
        if (self.auction_info.highest_bidder != null) {
            send(Sender{
                to: self.auction_info.highest_bidder!!,
                value: self.auction_info.current_bid,
                mode: SendPayGasSeparately,
                body: comment("bid_refund")
            });
        }

        // Update auction state
        self.auction_info.current_bid = msg.amount;
        self.auction_info.highest_bidder = msg.bidder;

        // Extend auction time if bid is close to end (within extension window)
        let time_remaining: Int = self.auction_info.end_time - current_time;
        if (time_remaining < self.auction_info.extension_time) {
            self.auction_info.end_time = self.auction_info.end_time + self.auction_info.extension_time;
        }

        self.unlock();
    }

    receive(msg: EndAuction) {
        self.requireNotPaused();
        self.requireNotReentrant();

        let current_time: Int = now();
        if (current_time < self.auction_info.end_time && self.auction_info.highest_bidder != null) {
            self.unlock();
            throw(error::auction_already_ended);
        }

        if (!self.auction_info.is_active) {
            self.unlock();
            throw(error::auction_not_active);
        }

        self.auction_info.is_active = false;

        // Check if there are any bids
        if (self.auction_info.highest_bidder != null) {
            // Calculate fees
            let marketplace_fee: Int = self.auction_info.current_bid * self.marketplace_fee_percent / 10000;
            let seller_amount: Int = self.auction_info.current_bid - marketplace_fee;

            // Send marketplace fee
            if (self.marketplace_address != null) {
                send(Sender{
                    to: self.marketplace_address!!,
                    value: marketplace_fee,
                    mode: SendPayGasSeparately,
                    body: comment("marketplace_fee")
                });
            }

            // Send remaining to seller
            send(Sender{
                to: self.auction_info.seller_address,
                value: seller_amount,
                mode: SendPayGasSeparately,
                body: comment("seller_payment")
            });

            // Transfer NFT to winner
            send(Sender{
                to: self.auction_info.nft_item_address,
                value: ton("0.1"),
                mode: SendPayGasSeparately,
                body: comment("transfer_to_winner")
            });
        } else {
            // No bids - return NFT to seller
            send(Sender{
                to: self.auction_info.nft_item_address,
                value: ton("0.1"),
                mode: SendPayGasSeparately,
                body: comment("return_to_seller")
            });
        }

        self.unlock();
    }

    receive(msg: CancelAuction) {
        if (sender() != self.auction_info.seller_address) {
            throw(error::unauthorized);
        }

        if (!self.auction_info.is_active) {
            throw(error::auction_not_active);
        }

        // Only allow cancellation if no bids and before end time
        if (self.auction_info.highest_bidder != null) {
            throw(error::auction_already_ended);
        }

        // Return NFT to seller
        send(Sender{
            to: self.auction_info.nft_item_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("return_to_seller")
        });

        self.auction_info.is_active = false;
    }

    receive(msg: ClaimNFT) {
        self.requireNotPaused();

        if (!self.auction_info.is_active) {
            throw(error::auction_not_active);
        }

        if (self.auction_info.highest_bidder != msg.claimant) {
            throw(error::not_highest_bidder);
        }

        let current_time: Int = now();
        if (current_time < self.auction_info.end_time) {
            throw(error::auction_already_ended);
        }

        if (self.auction_info.winner_claimed) {
            throw(error::already_claimed);
        }

        // Calculate fees
        let marketplace_fee: Int = self.auction_info.current_bid * self.marketplace_fee_percent / 10000;
        let seller_amount: Int = self.auction_info.current_bid - marketplace_fee;

        // Send marketplace fee
        if (self.marketplace_address != null) {
            send(Sender{
                to: self.marketplace_address!!,
                value: marketplace_fee,
                mode: SendPayGasSeparately,
                body: comment("marketplace_fee")
            });
        }

        // Send remaining to seller
        send(Sender{
            to: self.auction_info.seller_address,
            value: seller_amount,
            mode: SendPayGasSeparately,
            body: comment("seller_payment")
        });

        // Transfer NFT to winner
        send(Sender{
            to: self.auction_info.nft_item_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_to_winner")
        });

        self.auction_info.is_active = false;
        self.auction_info.winner_claimed = true;
    }

    // Bounce handler
    receive bounced(msg: Any) {
        self.unlock();
    }

    // Getters
    get fun getAuctionInfo(): AuctionInfo {
        return self.auction_info;
    }

    get fun isActive(): Bool {
        return self.auction_info.is_active;
    }

    get fun getTimeRemaining(): Int {
        let remaining: Int = self.auction_info.end_time - now();
        if (remaining < 0) {
            return 0;
        }
        return remaining;
    }

    get fun getCurrentBid(): Int {
        return self.auction_info.current_bid;
    }

    get fun getHighestBidder(): Address? {
        return self.auction_info.highest_bidder;
    }

    get fun getMinimumBid(): Int {
        let min_increment: Int = self.auction_info.current_bid *
            self.auction_info.min_bid_increment / 10000;
        return self.auction_info.current_bid + min_increment;
    }
}

message PlaceBid {
    amount: Int;
    bidder: Address;
}

message EndAuction {}

message CancelAuction {}

message ClaimNFT {
    claimant: Address;
}
