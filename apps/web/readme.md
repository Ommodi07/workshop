You are an expert full-stack Web3 developer.

I have cloned an NFT Marketplace template. Your task is to MODIFY and EXTEND this project into a **NFT-Based Medical Record Ownership Platform**.

⚠️ IMPORTANT RULES:

* Work STEP-BY-STEP (do not generate everything at once)
* Modify existing code instead of rewriting everything
* Keep code modular and production-ready
* Use best practices for security (especially for medical data)
* Add comments explaining each part clearly

---

# 🎯 PROJECT OVERVIEW

Build a decentralized healthcare system where:

* Each patient owns an NFT representing their medical identity
* Medical records are stored OFF-CHAIN (IPFS)
* NFT stores metadata (not raw data)
* Patients control access to their records
* Doctors can view records only if granted permission
* All data must be encrypted before upload

---

# 🧩 STEP 1: ANALYZE EXISTING TEMPLATE

* Identify:

  * NFT minting logic
  * Wallet connection (MetaMask / ethers.js / wagmi)
  * Metadata structure
* Add comments explaining current structure
* Do NOT change anything yet

---

# 🧩 STEP 2: ADD USER ROLES (PATIENT / DOCTOR)

Implement:

* Role selection after wallet connect
* Store role in state (React Context or global store)

Modify:

* UI to show different dashboards based on role

---

# 🧩 STEP 3: MODIFY NFT METADATA STRUCTURE

Update metadata format:

{
name: "Patient Health NFT",
description: "Secure medical record",
patientId: walletAddressHash,
records: [
{
type: "MRI",
date: "YYYY-MM-DD",
cid: "IPFS hash",
encrypted: true
}
]
}

* Ensure metadata is NOT storing raw files
* Refactor minting function to use this schema

---

# 🧩 STEP 4: IMPLEMENT FILE UPLOAD + IPFS STORAGE

Add:

* File input component
* Function to upload to IPFS (use Pinata or Web3.Storage)

Flow:
File → Encrypt → Upload → Return CID

Create:

* /utils/ipfs.js

---

# 🧩 STEP 5: ADD FILE ENCRYPTION

Before uploading:

* Encrypt file using AES (crypto-js)

Create:

* /utils/encryption.js

Functions:

* encryptFile(file, key)
* decryptFile(file, key)

⚠️ Do NOT store encryption key on-chain

---

# 🧩 STEP 6: ADD MEDICAL RECORD FEATURE

Create:

* "Add Record" form

On submit:

* Encrypt file
* Upload to IPFS
* Append record to metadata

Update:

* NFT metadata (use backend or dynamic metadata API if needed)

---

# 🧩 STEP 7: SMART CONTRACT ACCESS CONTROL

Modify or extend contract:

mapping(uint256 => mapping(address => bool)) access;

function grantAccess(uint256 tokenId, address doctor) public;
function revokeAccess(uint256 tokenId, address doctor) public;
function checkAccess(uint256 tokenId, address user) public view returns(bool);

* Ensure only owner can grant/revoke

---

# 🧩 STEP 8: CONNECT FRONTEND TO CONTRACT

Using ethers.js or wagmi:

* Create functions:

  * grantAccess()
  * revokeAccess()
  * checkAccess()

Add UI:

* Input for doctor wallet
* Buttons for grant/revoke

---

# 🧩 STEP 9: DOCTOR DASHBOARD

Create:

* Page: /doctor

Features:

* Enter patient NFT ID
* Check access via contract

If access granted:

* Fetch metadata
* Show records

Else:

* Show "Access Denied"

---

# 🧩 STEP 10: FETCH + DECRYPT RECORDS

Flow:

* Get CID from metadata
* Fetch file from IPFS
* Decrypt using key

Display:

* Image / PDF viewer

---

# 🧩 STEP 11: SECURITY IMPROVEMENTS

Implement:

* Never store raw medical data on blockchain
* Handle encryption keys securely (local or user-provided)
* Validate inputs
* Add error handling

---

# 🧩 STEP 12: OPTIONAL ADVANCED FEATURES

If time permits, add:

* Expiry-based access
* Activity logs
* Multi-file support per record

---

# 📦 OUTPUT FORMAT

For each step:

* Modify existing files where possible
* Clearly mention:

  * File name
  * Code changes
  * New components
* Add comments in code

---

# 🚫 DO NOT

* Do NOT generate entire project at once
* Do NOT skip steps
* Do NOT use dummy logic for blockchain/IPFS
* Do NOT store sensitive data in plain text

---

# 🎯 END GOAL

A working Web3 app where:

* Patient mints NFT
* Uploads encrypted medical records
* Grants access to doctors
* Doctors securely view records

Start from STEP 1 and proceed step-by-step.
