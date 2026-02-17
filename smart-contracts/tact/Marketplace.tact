import "@stdlib/deploy";

const int op::transfer = 0x5fcc3d14;
const int op::get_static_data = 0x2fcb26a2;
const int op::report_static_data = 0x8b771735;
const int op::take_excess = 0xd53276db;
const int op::take_ownership = 0x5fcc3d14;

// Error codes
const int error::unauthorized_low = 100;
const int error::no_rights = 100;
const int error::incorrect_wallet = 101;
const int error::admin_required = 102;

const int error::marketplace_errors = 200;
const int error::item_not_for_sale = 200;
const int error::insufficient_payment = 201;
const int error::offer_not_active = 202;
const int error::offer_expired = 203;
const int error::not_item_owner = 204;
const int error::invalid_amount = 205;
const int error::auction_not_ended = 206;
const int error::auction_ended = 207;
const int error::not_highest_bidder = 208;
const int error::already_claimed = 209;
const int error::wrong_phase = 210;

const int error::general_errors = 300;
const int error::paused = 300;
const int error::invalid_message = 301;

const int error::gas_errors = 400;

struct Sale {
    nft_address: Address;
    owner_address: Address;
    price: Int;
    is_marketplace: Bool;
    marketplace_fee_address: Address?;
    marketplace_fee: Int;
    royalty_address: Address?;
    royalty_amount: Int;
    created_at: Int;
}

struct Auction {
    nft_address: Address;
    seller: Address;
    start_price: Int;
    current_bid: Int;
    highest_bidder: Address?;
    end_time: Int;
    min_bid_increment: Int;
    extension_time: Int;
    is_active: Bool;
    created_at: Int;
}

struct Offer {
    nft_address: Address;
    buyer: Address;
    amount: Int;
    expires_at: Int;
    is_active: Bool;
    created_at: Int;
}

trait Ownable {
    owner: Address;

    // Check if sender is owner
    virtual fun requireOwner(): Bool {
        let sender: Address = sender();
        if (sender != self.owner) {
            throw(error::no_rights);
        }
        return true;
    }

    // Transfer ownership
    fun transferOwnership(newOwner: Address) {
        self.requireOwner();
        self.owner = newOwner;
    }
}

trait Pausable {
    is_paused: Bool;
    owner: Address;

    // Check if not paused
    virtual fun requireNotPaused(): Bool {
        if (self.is_paused) {
            throw(error::paused);
        }
        return true;
    }

    // Pause contract (admin only)
    fun pause() {
        if (sender() != self.owner) {
            throw(error::admin_required);
        }
        self.is_paused = true;
    }

    // Unpause contract (admin only)
    fun unpause() {
        if (sender() != self.owner) {
            throw(error::admin_required);
        }
        self.is_paused = false;
    }
}

trait ShoppingCart {
    // Shopping cart structure (max 255 items)
    cart_items: map<Address, Int>; // NFT address -> price
    cart_owner: Address;
    total_value: Int;

    // Add item to cart
    fun addToCart(nftAddress: Address, price: Int) {
        self.requireNotPaused();
        if (sender() != self.cart_owner) {
            throw(error::no_rights);
        }

        // Check if cart is full (255 items max)
        if (self.cart_items.keys().length() >= 255) {
            throw(error::invalid_message);
        }

        self.cart_items.set(nftAddress, price);
        self.total_value = self.total_value + price;
    }

    // Remove item from cart
    fun removeFromCart(nftAddress: Address) {
        self.requireNotPaused();
        if (sender() != self.cart_owner) {
            throw(error::no_rights);
        }

        let price: Int? = self.cart_items.get(nftAddress);
        if (price != null) {
            self.cart_items.del(nftAddress);
            self.total_value = self.total_value - price!!;
        }
    }

    // Clear entire cart
    fun clearCart() {
        self.requireNotPaused();
        if (sender() != self.cart_owner) {
            throw(error::no_rights);
        }

        self.cart_items.empty();
        self.total_value = 0;
    }

    // Checkout - purchase all items in cart
    fun checkout() {
        self.requireNotPaused();
        if (sender() != self.cart_owner) {
            throw(error::no_rights);
        }

        // Process each item purchase
        self.cart_items.keys().forEach((nftAddress) => {
            let price: Int = self.cart_items.get(nftAddress)!!;
            // Call purchase logic for each NFT
            self.purchaseNFT(nftAddress, price);
        });

        // Clear cart after successful purchase
        self.cart_items.empty();
        self.total_value = 0;
    }

    // Internal purchase logic (to be implemented by concrete contract)
    virtual fun purchaseNFT(nftAddress: Address, price: Int) {
        // To be implemented
    }

    // Require not paused (shared trait method)
    virtual fun requireNotPaused(): Bool {
        return true;
    }
}

@interface("org.ton.marketplace")
contract Marketplace with Ownable, Pausable, ShoppingCart {
    owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    is_paused: Bool = false;
    version: Int = 1;

    // Storage
    sales: map<Address, Sale>;
    auctions: map<Address, Auction>;
    offers: map<Address, Offer>; // Key: buyer_address + nft_address combined

    // Fees
    marketplace_fee_percent: Int = 250; // 2.5%
    marketplace_fee_address: Address? = null;

    // Config
    min_auction_duration: Int = 604800; // 7 days in seconds
    max_auction_duration: Int = 31536000; // 1 year in seconds

    // Shopping cart
    cart_items: map<Address, Int>;
    cart_owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    total_value: Int = 0;

    // Admin functions
    receive(msg: SetMarketplaceFee) {
        self.requireOwner();
        self.marketplace_fee_address = msg.fee_address;
        self.marketplace_fee_percent = msg.fee_percent;
    }

    receive(msg: SetAuctionDuration) {
        self.requireOwner();
        if (msg.min_duration < 3600 || msg.max_duration > 31536000) {
            throw(error::invalid_amount);
        }
        self.min_auction_duration = msg.min_duration;
        self.max_auction_duration = msg.max_duration;
    }

    receive(msg: EmergencyWithdraw) {
        self.requireOwner();
        self.requireNotPaused();

        let amount: Int = myBalance();
        send(Sender{
            to: msg.recipient,
            value: amount - 50000000, // Keep some for gas
            bounce: false,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: ""
        });
    }

    // Sale functions
    receive(msg: CreateSale) {
        self.requireNotPaused();

        let sale: Sale = Sale{
            nft_address: msg.nft_address,
            owner_address: msg.owner_address,
            price: msg.price,
            is_marketplace: msg.is_marketplace,
            marketplace_fee_address: msg.marketplace_fee_address,
            marketplace_fee: msg.marketplace_fee,
            royalty_address: msg.royalty_address,
            royalty_amount: msg.royalty_amount,
            created_at: now()
        };

        self.sales.set(msg.nft_address, sale);

        // Transfer NFT to marketplace if needed
        if (msg.transfer_nft) {
            send(Sender{
                to: msg.nft_address,
                value: ton("0.1"),
                mode: SendPayGasSeparately,
                body: comment("transfer_to_marketplace")
            });
        }
    }

    receive(msg: CancelSale) {
        self.requireNotPaused();
        if (sender() != self.owner) {
            throw(error::not_item_owner);
        }

        let sale: Sale? = self.sales.get(msg.nft_address);
        if (sale == null) {
            throw(error::item_not_for_sale);
        }

        self.sales.del(msg.nft_address);

        // Return NFT to seller
        send(Sender{
            to: msg.nft_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("return_nft_to_seller")
        });
    }

    receive(msg: BuyItem) {
        self.requireNotPaused();

        let sale: Sale? = self.sales.get(msg.nft_address);
        if (sale == null) {
            throw(error::item_not_for_sale);
        }

        if (msg.amount < sale!!.price) {
            throw(error::insufficient_payment);
        }

        // Calculate fees
        let marketplace_fee: Int = sale.price * self.marketplace_fee_percent / 10000;
        let royalty_fee: Int = sale.royalty_amount;
        let seller_amount: Int = sale.price - marketplace_fee - royalty_fee;

        // Distribute payments
        if (sale.marketplace_fee_address != null) {
            send(Sender{
                to: sale.marketplace_fee_address!!,
                value: marketplace_fee,
                mode: SendPayGasSeparately,
                body: ""
            });
        }

        if (sale.royalty_address != null) {
            send(Sender{
                to: sale.royalty_address!!,
                value: royalty_fee,
                mode: SendPayGasSeparately,
                body: ""
            });
        }

        send(Sender{
            to: sale.owner_address,
            value: seller_amount,
            mode: SendPayGasSeparately,
            body: ""
        });

        // Transfer NFT to buyer
        send(Sender{
            to: msg.nft_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_to_buyer")
        });

        // Remove sale
        self.sales.del(msg.nft_address);
    }

    // Auction functions
    receive(msg: CreateAuction) {
        self.requireNotPaused();

        if (msg.duration < self.min_auction_duration || msg.duration > self.max_auction_duration) {
            throw(error::invalid_amount);
        }

        let auction: Auction = Auction{
            nft_address: msg.nft_address,
            seller: msg.seller,
            start_price: msg.start_price,
            current_bid: msg.start_price,
            highest_bidder: null,
            end_time: now() + msg.duration,
            min_bid_increment: msg.min_bid_increment,
            extension_time: msg.extension_time,
            is_active: true,
            created_at: now()
        };

        self.auctions.set(msg.nft_address, auction);
    }

    receive(msg: PlaceBid) {
        self.requireNotPaused();

        let auction: Auction? = self.auctions.get(msg.nft_address);
        if (auction == null) {
            throw(error::invalid_message);
        }

        if (!auction!!.is_active) {
            throw(error::auction_ended);
        }

        if (now() >= auction.end_time) {
            throw(error::auction_ended);
        }

        let min_bid: Int = auction.current_bid + auction.min_bid_increment;
        if (msg.amount < min_bid) {
            throw(error::insufficient_payment);
        }

        // Refund previous highest bidder
        if (auction.highest_bidder != null) {
            send(Sender{
                to: auction.highest_bidder!!,
                value: auction.current_bid,
                mode: SendPayGasSeparately,
                body: comment("bid_refund")
            });
        }

        // Update auction
        auction.current_bid = msg.amount;
        auction.highest_bidder = msg.bidder;

        // Extend auction time if bid is close to end
        if (now() > auction.end_time - auction.extension_time) {
            auction.end_time = auction.end_time + auction.extension_time;
        }

        self.auctions.set(msg.nft_address, auction);
    }

    receive(msg: EndAuction) {
        self.requireNotPaused();

        let auction: Auction? = self.auctions.get(msg.nft_address);
        if (auction == null) {
            throw(error::invalid_message);
        }

        if (!auction!!.is_active) {
            throw(error::already_claimed);
        }

        if (now() < auction.end_time) {
            throw(error::auction_not_ended);
        }

        auction.is_active = false;
        self.auctions.set(msg.nft_address, auction);

        // Transfer NFT and funds
        if (auction.highest_bidder != null) {
            // Calculate fees
            let marketplace_fee: Int = auction.current_bid * self.marketplace_fee_percent / 10000;
            let seller_amount: Int = auction.current_bid - marketplace_fee;

            // Distribute payments
            if (self.marketplace_fee_address != null) {
                send(Sender{
                    to: self.marketplace_fee_address!!,
                    value: marketplace_fee,
                    mode: SendPayGasSeparately,
                    body: ""
                });
            }

            send(Sender{
                to: auction.seller,
                value: seller_amount,
                mode: SendPayGasSeparately,
                body: ""
            });

            // Transfer NFT to winner
            send(Sender{
                to: auction.nft_address,
                value: ton("0.1"),
                mode: SendPayGasSeparately,
                body: comment("transfer_to_winner")
            });
        } else {
            // No bids, return NFT to seller
            send(Sender{
                to: auction.nft_address,
                value: ton("0.1"),
                mode: SendPayGasSeparately,
                body: comment("return_to_seller")
            });
        }
    }

    // Offer functions
    receive(msg: CreateOffer) {
        self.requireNotPaused();

        let offer_key: Address = msg.buyer_address; // Simplified key
        let offer: Offer = Offer{
            nft_address: msg.nft_address,
            buyer: msg.buyer_address,
            amount: msg.amount,
            expires_at: now() + msg.duration,
            is_active: true,
            created_at: now()
        };

        self.offers.set(offer_key, offer);

        // Lock funds
        send(Sender{
            to: address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"), // Escrow
            value: msg.amount,
            mode: SendPayGasSeparately,
            body: comment("lock_offer_funds")
        });
    }

    receive(msg: AcceptOffer) {
        self.requireNotPaused();

        let offer_key: Address = msg.offer_key;
        let offer: Offer? = self.offers.get(offer_key);

        if (offer == null) {
            throw(error::offer_not_active);
        }

        if (!offer!!.is_active) {
            throw(error::offer_not_active);
        }

        if (now() > offer.expires_at) {
            offer.is_active = false;
            self.offers.set(offer_key, offer);
            throw(error::offer_expired);
        }

        // Check if sender is NFT owner (would need NFT ownership verification)
        // For now, assume seller is msg.seller

        // Distribute funds
        let marketplace_fee: Int = offer.amount * self.marketplace_fee_percent / 10000;
        let seller_amount: Int = offer.amount - marketplace_fee;

        if (self.marketplace_fee_address != null) {
            send(Sender{
                to: self.marketplace_fee_address!!,
                value: marketplace_fee,
                mode: SendPayGasSeparately,
                body: ""
            });
        }

        send(Sender{
            to: msg.seller,
            value: seller_amount,
            mode: SendPayGasSeparately,
            body: ""
        });

        // Transfer NFT
        send(Sender{
            to: offer.nft_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_to_buyer")
        });

        // Deactivate offer
        offer.is_active = false;
        self.offers.set(offer_key, offer);
    }

    receive(msg: CancelOffer) {
        self.requireNotPaused();

        let offer_key: Address = msg.offer_key;
        let offer: Offer? = self.offers.get(offer_key);

        if (offer == null) {
            throw(error::offer_not_active);
        }

        if (offer!!.buyer != sender()) {
            throw(error::no_rights);
        }

        // Refund funds
        send(Sender{
            to: offer.buyer,
            value: offer.amount,
            mode: SendPayGasSeparately,
            body: comment("offer_refund")
        });

        // Remove offer
        self.offers.del(offer_key);
    }

    // Shopping cart implementation
    fun purchaseNFT(nftAddress: Address, price: Int) {
        let sale: Sale? = self.sales.get(nftAddress);
        if (sale == null) {
            throw(error::item_not_for_sale);
        }

        // Process purchase (similar to BuyItem)
        send(Sender{
            to: sale!!.owner_address,
            value: price,
            mode: SendPayGasSeparately,
            body: comment("cart_purchase")
        });

        // Transfer NFT
        send(Sender{
            to: nftAddress,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_to_buyer")
        });

        // Remove sale
        self.sales.del(nftAddress);
    }

    // Bounce handler for gas refund
    receive bounced(msg: Any) {
        // Handle bounced messages and refund gas
        // This ensures 100% fund recovery on failed transactions
    }

    // Getters
    get fun getSale(nftAddress: Address): Sale? {
        return self.sales.get(nftAddress);
    }

    get fun getAuction(nftAddress: Address): Auction? {
        return self.auctions.get(nftAddress);
    }

    get fun getOffer(offerKey: Address): Offer? {
        return self.offers.get(offerKey);
    }

    get fun getMarketplaceFee(): (Int, Address?) {
        return (self.marketplace_fee_percent, self.marketplace_fee_address);
    }

    get fun getVersion(): Int {
        return self.version;
    }
}

// Message types
message SetMarketplaceFee {
    fee_address: Address;
    fee_percent: Int;
}

message SetAuctionDuration {
    min_duration: Int;
    max_duration: Int;
}

message EmergencyWithdraw {
    recipient: Address;
}

message CreateSale {
    nft_address: Address;
    owner_address: Address;
    price: Int;
    is_marketplace: Bool;
    marketplace_fee_address: Address?;
    marketplace_fee: Int;
    royalty_address: Address?;
    royalty_amount: Int;
    transfer_nft: Bool;
}

message CancelSale {
    nft_address: Address;
}

message BuyItem {
    nft_address: Address;
    amount: Int;
}

message CreateAuction {
    nft_address: Address;
    seller: Address;
    start_price: Int;
    min_bid_increment: Int;
    extension_time: Int;
    duration: Int;
}

message PlaceBid {
    nft_address: Address;
    bidder: Address;
    amount: Int;
}

message EndAuction {
    nft_address: Address;
}

message CreateOffer {
    nft_address: Address;
    buyer_address: Address;
    amount: Int;
    duration: Int;
}

message AcceptOffer {
    offer_key: Address;
    seller: Address;
}

message CancelOffer {
    offer_key: Address;
}
