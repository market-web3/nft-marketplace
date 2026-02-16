// ReentrancyGuard trait for Tact contracts
// Prevents reentrancy attacks

const int error::reentrancy = 400;

trait ReentrancyGuard {
    is_locked: Bool;

    // Initialize reentrancy guard
    fun initReentrancyGuard() {
        self.is_locked = false;
    }

    // Check for reentrancy and lock
    virtual fun requireNotReentrant(): Bool {
        if (self.is_locked) {
            throw(error::reentrancy);
        }
        self.is_locked = true;
        return true;
    }

    // Unlock after execution
    fun unlock() {
        self.is_locked = false;
    }

    // Check if currently locked
    get fun isLocked(): Bool {
        return self.is_locked;
    }
}
