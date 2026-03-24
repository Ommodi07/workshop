extern crate alloc;

// Modules and imports
mod erc721;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    abi::Bytes,
    call::Call,
    contract,
    msg,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};

// Interfaces for the Art contract and the ERC20 contract
sol_interface! {
    interface NftArt {
        function initialize(address token_contract_address) external;
        function generateArt(uint256 token_id, address owner) external returns(string);
    }
}

struct RobinhoodNFTParams;

/// Immutable definitions
impl Erc721Params for RobinhoodNFTParams {
    const NAME: &'static str = "RobinhoodNFT";
    const SYMBOL: &'static str = "RHNFT";
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct RobinhoodNFT {
        address art_contract_address;

        // Medical record access control:
        // token_id => (doctor_address => has_access)
        mapping(uint256 => mapping(address => bool)) access;
        // Optional expiry for granted access:
        // token_id => (doctor_address => unix_timestamp_seconds), 0 = no expiry
        mapping(uint256 => mapping(address => uint256)) access_expiry;

        #[borrow] // Allows erc721 to access MyToken's storage and make calls
        Erc721<RobinhoodNFTParams> erc721;
    }
}

// Declare Solidity error types
sol! {
    /// Contract has already been initialized
    error AlreadyInitialized();
    /// A call to an external contract failed
    error ExternalCallFailed();
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum RobinhoodNFTError {
    AlreadyInitialized(AlreadyInitialized),
    ExternalCallFailed(ExternalCallFailed),
}

#[public]
#[inherit(Erc721<RobinhoodNFTParams>)]
impl RobinhoodNFT {
    // Current template mint endpoint: caller receives a newly minted NFT.
    /// Mints an NFT, but does not call onErc712Received
    pub fn mint(&mut self) -> Result<(), Vec<u8>> {
        let minter = msg::sender();
        self.erc721.mint(minter)?;
        Ok(())
    }

    // Alternate mint endpoint used by UIs/services that mint to a specified address.
    /// Mints an NFT to the specified address, and does not call onErc712Received
    pub fn mint_to(&mut self, to: Address) -> Result<(), Vec<u8>> {
        self.erc721.mint(to)?;
        Ok(())
    }

    /// Mints an NFT and calls onErc712Received with empty data
    pub fn safe_mint(&mut self, to: Address) -> Result<(), Vec<u8>> {
        Erc721::safe_mint(self, to, Vec::new())?;
        Ok(())
    }

    /// Burns an NFT
    pub fn burn(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        // This function checks that msg::sender() owns the specified token_id
        // Note: current contract here exposes ownership and transfer logic only.
        // It does not add custom medical-record fields; metadata is handled via URI patterns.
        self.erc721.burn(msg::sender(), token_id)?;
        Ok(())
    }

    /// Grants read access for a doctor to a patient's token-linked records.
    /// Only the current token owner can grant access.
    pub fn grant_access(&mut self, token_id: U256, doctor: Address) -> Result<(), Vec<u8>> {
        let owner = self.erc721.owner_of(token_id)?;
        if msg::sender() != owner {
            return Err(b"Only token owner can grant access".to_vec());
        }

        self.access.setter(token_id).insert(doctor, true);
        self.access_expiry.setter(token_id).insert(doctor, U256::ZERO);
        Ok(())
    }

    /// Grants read access with an expiry timestamp (unix seconds).
    /// Only the token owner can grant access with expiry.
    pub fn grant_access_with_expiry(
        &mut self,
        token_id: U256,
        doctor: Address,
        expires_at: U256,
    ) -> Result<(), Vec<u8>> {
        let owner = self.erc721.owner_of(token_id)?;
        if msg::sender() != owner {
            return Err(b"Only token owner can grant access".to_vec());
        }
        if expires_at == U256::ZERO {
            return Err(b"Expiry must be a valid future unix timestamp".to_vec());
        }

        self.access.setter(token_id).insert(doctor, true);
        self.access_expiry.setter(token_id).insert(doctor, expires_at);
        Ok(())
    }

    /// Revokes previously granted read access for a doctor.
    /// Only the current token owner can revoke access.
    pub fn revoke_access(&mut self, token_id: U256, doctor: Address) -> Result<(), Vec<u8>> {
        let owner = self.erc721.owner_of(token_id)?;
        if msg::sender() != owner {
            return Err(b"Only token owner can revoke access".to_vec());
        }

        self.access.setter(token_id).insert(doctor, false);
        self.access_expiry.setter(token_id).insert(doctor, U256::ZERO);
        Ok(())
    }

    /// Returns whether `user` currently has explicit access for `token_id`.
    /// Token owner check is implicit in grant/revoke mutation rules.
    pub fn check_access(&self, token_id: U256, user: Address) -> Result<bool, Vec<u8>> {
        Ok(self.access.getter(token_id).get(user))
    }

    /// Returns expiry unix timestamp for doctor access.
    /// 0 means no expiry or not granted with expiry.
    pub fn get_access_expiry(&self, token_id: U256, user: Address) -> Result<U256, Vec<u8>> {
        Ok(self.access_expiry.getter(token_id).get(user))
    }
}