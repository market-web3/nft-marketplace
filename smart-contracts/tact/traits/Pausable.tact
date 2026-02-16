// Pausable trait for Tact contracts
// Allows emergency pause/unpause functionality

const int error::paused = 300;

trait Pausable {
    is_paused: Bool;
    owner: Address;

    // Initialize pausable
    fun initPausable(initialOwner: Address) {
        self.is_paused = false;
        self.owner = initialOwner;
    }

    // Check if contract is not paused
    virtual fun requireNotPaused(): Bool {
        if (self.is_paused) {
            throw(error::paused);
        }
        return true;
    }

    // Check if contract is paused (for special admin operations)
    virtual fun requirePaused(): Bool {
        if (!self.is_paused) {
            throw(301); // Error: Not paused
        }
        return true;
    }

    // Pause contract (owner only)
    fun pause() {
        self.requireOwner();
        self.is_paused = true;
    }

    // Unpause contract (owner only)
    fun unpause() {
        self.requireOwner();
        self.is_paused = false;
    }

    // Get pause status
    get fun isPaused(): Bool {
        return self.is_paused;
    }

    // Check if caller is owner
    virtual fun requireOwner(): Bool {
        if (sender() != self.owner) {
            throw(100); // Error: Not authorized
        }
        return true;
    }
}
