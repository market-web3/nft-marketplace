// Ownable trait for Tact contracts
// Provides ownership management functionality

trait Ownable {
    owner: Address;

    // Initialize owner
    fun initOwnable(initialOwner: Address) {
        self.owner = initialOwner;
    }

    // Check if caller is owner
    virtual fun requireOwner(): Bool {
        if (sender() != self.owner) {
            throw(100); // Error: Not authorized
        }
        return true;
    }

    // Transfer ownership to new address
    fun transferOwnership(newOwner: Address) {
        self.requireOwner();
        self.owner = newOwner;
    }

    // Renounce ownership (sets to zero address)
    fun renounceOwnership() {
        self.requireOwner();
        self.owner = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
    }

    // Get current owner
    get fun getOwner(): Address {
        return self.owner;
    }
}

// Enhanced Ownable with two-step transfer
trait Ownable2Step {
    owner: Address;
    pending_owner: Address?;

    // Initialize owner
    fun initOwnable2Step(initialOwner: Address) {
        self.owner = initialOwner;
        self.pending_owner = null;
    }

    // Check if caller is owner
    virtual fun requireOwner(): Bool {
        if (sender() != self.owner) {
            throw(100); // Error: Not authorized
        }
        return true;
    }

    // Initiate ownership transfer
    fun transferOwnership(newOwner: Address) {
        self.requireOwner();
        self.pending_owner = newOwner;
    }

    // Accept ownership transfer (called by new owner)
    fun acceptOwnership() {
        if (self.pending_owner == null || sender() != self.pending_owner!!) {
            throw(101); // Error: Not authorized
        }
        self.owner = self.pending_owner!!;
        self.pending_owner = null;
    }

    // Renounce ownership
    fun renounceOwnership() {
        self.requireOwner();
        self.owner = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
        self.pending_owner = null;
    }

    // Get current owner
    get fun getOwner(): Address {
        return self.owner;
    }

    // Get pending owner
    get fun getPendingOwner(): Address? {
        return self.pending_owner;
    }
}
