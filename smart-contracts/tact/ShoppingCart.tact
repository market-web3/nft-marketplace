import "@stdlib/deploy";

// ShoppingCart trait for batch purchases
// Allows users to add multiple NFTs to cart and checkout in a single transaction

const int error::cart_errors = 100;
const int error::unauthorized = 100;
const int error::cart_full = 101;
const int error::item_not_in_cart = 102;
const int error::insufficient_balance = 103;
const int error::purchase_failed = 104;

const int MAX_CART_ITEMS: Int = 255; // TON message limit

struct CartItem {
    nft_address: Address;
    price: Int;
    marketplace_address: Address;
    sale_type: Int; // 0 = direct sale, 1 = auction, 2 = offer
}

struct ShoppingCartData {
    owner: Address;
    items: map<Int, CartItem>; // index -> CartItem
    total_value: Int;
    item_count: Int;
    last_updated: Int;
}

trait ShoppingCart {
    cart_data: ShoppingCartData;

    // Initialize cart for owner
    fun initCart(owner: Address) {
        self.cart_data = ShoppingCartData{
            owner: owner,
            items: emptyMap(),
            total_value: 0,
            item_count: 0,
            last_updated: now()
        };
    }

    // Add item to cart
    fun addToCart(nftAddress: Address, price: Int, marketplaceAddr: Address, saleType: Int) {
        let sender_addr: Address = sender();

        // Check ownership
        if (sender_addr != self.cart_data.owner) {
            throw(error::unauthorized);
        }

        // Check if cart is full
        if (self.cart_data.item_count >= MAX_CART_ITEMS) {
            throw(error::cart_full);
        }

        // Check if item is already in cart
        self.cart_data.items.keys().forEach((index) => {
            let item: CartItem = self.cart_data.items.get(index)!!;
            if (item.nft_address == nftAddress) {
                throw(error::cart_errors); // Item already in cart
            }
        });

        // Add item to cart
        let new_index: Int = self.cart_data.item_count;
        let new_item: CartItem = CartItem{
            nft_address: nftAddress,
            price: price,
            marketplace_address: marketplaceAddr,
            sale_type: saleType
        };

        self.cart_data.items.set(new_index, new_item);
        self.cart_data.total_value = self.cart_data.total_value + price;
        self.cart_data.item_count = self.cart_data.item_count + 1;
        self.cart_data.last_updated = now();
    }

    // Remove item from cart
    fun removeFromCart(index: Int) {
        let sender_addr: Address = sender();

        // Check ownership
        if (sender_addr != self.cart_data.owner) {
            throw(error::unauthorized);
        }

        // Check if item exists
        if (!self.cart_data.items.exists(index)) {
            throw(error::item_not_in_cart);
        }

        let item: CartItem = self.cart_data.items.get(index)!!;
        self.cart_data.total_value = self.cart_data.total_value - item.price;
        self.cart_data.items.del(index);
        self.cart_data.item_count = self.cart_data.item_count - 1;
        self.cart_data.last_updated = now();
    }

    // Update item in cart (for price changes in auctions)
    fun updateCartItem(index: Int, newPrice: Int) {
        let sender_addr: Address = sender();

        // Check ownership
        if (sender_addr != self.cart_data.owner) {
            throw(error::unauthorized);
        }

        // Check if item exists
        if (!self.cart_data.items.exists(index)) {
            throw(error::item_not_in_cart);
        }

        let item: CartItem = self.cart_data.items.get(index)!!;

        // Update total value
        self.cart_data.total_value = self.cart_data.total_value - item.price + newPrice;

        // Update item
        let updated_item: CartItem = CartItem{
            nft_address: item.nft_address,
            price: newPrice,
            marketplace_address: item.marketplace_address,
            sale_type: item.sale_type
        };

        self.cart_data.items.set(index, updated_item);
        self.cart_data.last_updated = now();
    }

    // Clear entire cart
    fun clearCart() {
        let sender_addr: Address = sender();

        // Check ownership
        if (sender_addr != self.cart_data.owner) {
            throw(error::unauthorized);
        }

        self.cart_data.items.empty();
        self.cart_data.total_value = 0;
        self.cart_data.item_count = 0;
        self.cart_data.last_updated = now();
    }

    // Checkout - Purchase all items in cart
    // This is the main function that processes all purchases
    fun checkout(msgValue: Int) {
        let sender_addr: Address = sender();

        // Check ownership
        if (sender_addr != self.cart_data.owner) {
            throw(error::unauthorized);
        }

        // Check if cart is empty
        if (self.cart_data.item_count == 0) {
            return;
        }

        // Check if payment is sufficient
        if (msgValue < self.cart_data.total_value) {
            throw(error::insufficient_balance);
        }

        // Process each item purchase
        var remaining_value: Int = self.cart_data.total_value;
        var failed_count: Int = 0;

        self.cart_data.items.keys().forEach((index) => {
            let item: CartItem = self.cart_data.items.get(index)!!;

            // Send purchase message to marketplace
            // In a real implementation, this would send a properly formatted message
            send(Sender{
                to: item.marketplace_address,
                value: item.price,
                mode: SendPayGasSeparately,
                body: comment("cart_purchase")
            });

            remaining_value = remaining_value - item.price;
        });

        // Clear cart after purchase
        self.cart_data.items.empty();
        self.cart_data.total_value = 0;
        self.cart_data.item_count = 0;
        self.cart_data.last_updated = now();

        // Refund any remaining value (gas optimization)
        if (remaining_value > 0) {
            send(Sender{
                to: sender_addr,
                value: remaining_value,
                mode: SendPayGasSeparately,
                body: comment("excess_refund")
            });
        }
    }

    // Get cart information
    get fun getCartInfo(): ShoppingCartData {
        return self.cart_data;
    }

    // Get specific cart item
    get fun getCartItem(index: Int): CartItem? {
        return self.cart_data.items.get(index);
    }

    // Get cart total
    get fun getCartTotal(): Int {
        return self.cart_data.total_value;
    }

    // Get cart item count
    get fun getCartCount(): Int {
        return self.cart_data.item_count;
    }
}

// Standalone ShoppingCart Contract
// Can be used as a standalone contract or as part of a larger marketplace
@interface("org.ton.marketplace.cart")
contract ShoppingCartContract with ShoppingCart {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
        self.initCart(owner);
    }

    receive(msg: AddToCartMessage) {
        self.addToCart(
            msg.nft_address,
            msg.price,
            msg.marketplace_address,
            msg.sale_type
        );
    }

    receive(msg: RemoveFromCartMessage) {
        self.removeFromCart(msg.index);
    }

    receive(msg: UpdateCartItemMessage) {
        self.updateCartItem(msg.index, msg.new_price);
    }

    receive(msg: ClearCartMessage) {
        self.clearCart();
    }

    receive(msg: CheckoutMessage) {
        self.checkout(msg.value);
    }
}

// Message types for ShoppingCartContract
message AddToCartMessage {
    nft_address: Address;
    price: Int;
    marketplace_address: Address;
    sale_type: Int;
}

message RemoveFromCartMessage {
    index: Int;
}

message UpdateCartItemMessage {
    index: Int;
    new_price: Int;
}

message ClearCartMessage {}

message CheckoutMessage {
    value: Int;
}
