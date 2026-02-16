import "@stdlib/deploy";

const int error::general_errors = 100;
const int error::unauthorized = 100;
const int error::invalid_amount = 101;
const int error::sale_not_active = 102;
const int error::already_purchased = 103;

struct SaleInfo {
    nft_item_address: Address;
    seller_address: Address;
    price: Int;
    marketplace_fee: Int;
    royalty_fee: Int;
    marketplace_address: Address?;
    royalty_address: Address?;
    is_active: Bool;
    created_at: Int;
}

trait ReentrancyGuard {
    is_locked: Bool;

    // Check reentrancy
    virtual fun requireNotReentrant(): Bool {
        if (self.is_locked) {
            throw(error::general_errors);
        }
        self.is_locked = true;
        return true;
    }

    // Unlock after execution
    fun unlock() {
        self.is_locked = false;
    }
}

@interface("org.ton.marketplace.sale")
contract Sale with ReentrancyGuard {
    owner: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    is_locked: Bool = false;

    sale_info: SaleInfo;

    init(owner: Address, nftAddress: Address, price: Int, marketplaceFee: Int, royaltyFee: Int,
         marketplaceAddr: Address?, royaltyAddr: Address?) {
        self.owner = owner;

        self.sale_info = SaleInfo{
            nft_item_address: nftAddress,
            seller_address: owner,
            price: price,
            marketplace_fee: marketplaceFee,
            royalty_fee: royaltyFee,
            marketplace_address: marketplaceAddr,
            royalty_address: royaltyAddr,
            is_active: true,
            created_at: now()
        };
    }

    receive(msg: Buy) {
        self.requireNotReentrant();

        if (!self.sale_info.is_active) {
            self.unlock();
            throw(error::sale_not_active);
        }

        if (msg.amount < self.sale_info.price) {
            self.unlock();
            throw(error::invalid_amount);
        }

        // Calculate distribution
        let marketplace_amount: Int = self.sale_info.price * self.sale_info.marketplace_fee / 10000;
        let royalty_amount: Int = self.sale_info.price * self.sale_info.royalty_fee / 10000;
        let seller_amount: Int = self.sale_info.price - marketplace_amount - royalty_amount;

        // Send marketplace fee
        if (self.sale_info.marketplace_address != null) {
            send(Sender{
                to: self.sale_info.marketplace_address!!,
                value: marketplace_amount,
                mode: SendPayGasSeparately,
                body: comment("marketplace_fee")
            });
        }

        // Send royalty fee
        if (self.sale_info.royalty_address != null) {
            send(Sender{
                to: self.sale_info.royalty_address!!,
                value: royalty_amount,
                mode: SendPayGasSeparately,
                body: comment("royalty_fee")
            });
        }

        // Send remaining to seller
        send(Sender{
            to: self.sale_info.seller_address,
            value: seller_amount,
            mode: SendPayGasSeparately,
            body: comment("seller_payment")
        });

        // Transfer NFT to buyer
        send(Sender{
            to: self.sale_info.nft_item_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("transfer_nft")
        });

        // Mark sale as complete
        self.sale_info.is_active = false;

        // Refund excess to buyer
        if (msg.amount > self.sale_info.price) {
            let excess: Int = msg.amount - self.sale_info.price;
            send(Sender{
                to: msg.buyer,
                value: excess,
                mode: SendPayGasSeparately,
                body: comment("excess_refund")
            });
        }

        self.unlock();
    }

    receive(msg: CancelSale) {
        if (sender() != self.sale_info.seller_address) {
            throw(error::unauthorized);
        }

        if (!self.sale_info.is_active) {
            throw(error::sale_not_active);
        }

        // Return NFT to seller
        send(Sender{
            to: self.sale_info.nft_item_address,
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            body: comment("return_to_seller")
        });

        self.sale_info.is_active = false;
    }

    // Bounce handler for gas refund
    receive bounced(msg: Any) {
        self.unlock();
    }

    // Getters
    get fun getSaleInfo(): SaleInfo {
        return self.sale_info;
    }

    get fun isActive(): Bool {
        return self.sale_info.is_active;
    }

    get fun getPrice(): Int {
        return self.sale_info.price;
    }
}

message Buy {
    amount: Int;
    buyer: Address;
}

message CancelSale {}
