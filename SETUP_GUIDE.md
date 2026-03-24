# MedicalNFT Platform - Setup Guide

## ⚠️ Current Issues

You're experiencing two issues:

1. **"Contract Not Deployed"** - Missing `NEXT_PUBLIC_NFT_ADDRESS` environment variable
2. **"IPFS file upload error"** - Missing `PINATA_JWT` environment variable

---

## 🚀 Quick Setup Checklist

- [ ] **Step 1**: Get Pinata JWT token (5 minutes)
- [ ] **Step 2**: Deploy NFT contract (5-10 minutes)
- [ ] **Step 3**: Update .env with values
- [ ] **Step 4**: Restart dev server
- [ ] **Step 5**: Test the application

---

## Step 1: Setup Pinata IPFS (Required for File Uploads) ⏱️ 5 mins

### Why Pinata?
Pinata is an IPFS hosting service that allows you to upload encrypted medical files. It's required for the patient dashboard to upload medical records.

### How to Get JWT Token

1. **Sign up / Log in to Pinata**
   - Go to: https://app.pinata.cloud
   - Sign up with email or wallet
   - Verify your email

2. **Navigate to API Keys**
   - Click your account in top right
   - Select "API Keys"
   - Or go directly to: https://app.pinata.cloud/keys

3. **Create a New API Key**
   - Click "Create new key"
   - Give it a name: `MedicalNFT`
   - Select permissions:
     - ✅ pinFileToIPFS
     - ✅ pinJSONToIPFS
     - ✅ userPinPolicy (to list files)
   - Click "Generate"

4. **Copy the JWT Token**
   - Copy the "JWT" value (long string starting with `eyJ...`)
   - ⚠️ Keep this secret! Don't commit to Git

5. **Add to .env**
   ```
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Testing Pinata Setup

After updating .env:
```bash
npm run dev
```

Try uploading a medical record in the patient dashboard. If it works, Pinata is configured correctly!

---

## Step 2: Deploy NFT Contract (Required for Patient Portal) ⏱️ 5-10 mins

### Why Deploy?
The NFT contract creates unique medical identity tokens for patients. These NFTs store encrypted pointers to their medical records on IPFS.

### Prerequisites
You need:
- A **private key** (from a wallet like MetaMask)
- **ETH on Arbitrum Sepolia testnet** (for gas fees)

### Get Private Key from MetaMask

1. **Open MetaMask**
   - Click the account icon (top right)
   - Select "Account details"
   - Click "Show Private Key"
   - Enter your password
   - ⚠️ Copy it carefully - don't screenshot publicly
   - Add to .env:
   ```
   PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

### Get Testnet ETH

1. **Switch to Arbitrum Sepolia in MetaMask**
   - Click the network dropdown (top left)
   - Select "Add Network" if not listed
   - Use these settings:
     - Network Name: `Arbitrum Sepolia`
     - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
     - Chain ID: `421614`
     - Currency: `ETH`

2. **Get testnet ETH (free)**
   - Go to Arbitrum Sepolia faucet: https://sepolia.arbitrum.io/
   - Connect your wallet
   - Request 0.5 ETH (usually takes 1-2 minutes)
   - Repeat if you run out

### Deploy Contract

1. **Run deployment script**
   ```bash
   npm run deploy:erc721
   ```

2. **Wait for deployment**
   - Takes 2-5 minutes
   - You'll see transaction hashes (txHash)
   - Watch for: "Contract deployed at: 0x..."

3. **Copy Contract Address**
   - Example output:
     ```
     ✅ Contract deployed at: 0x5f3f2d1c9e4a8b7f0c5d1e9a2f4c7d8e9f0c5d1
     ```
   - Add to .env:
   ```
   NEXT_PUBLIC_NFT_ADDRESS=0x5f3f2d1c9e4a8b7f0c5d1e9a2f4c7d8e9f0c5d1
   ```

### Troubleshooting Deployment

**"Insufficient balance"**
- Get more testnet ETH from the faucet
- Make sure you're on Arbitrum Sepolia network

**"RPC error"**
- Check your internet connection
- Try a different RPC endpoint

**"Private key error"**
- Make sure PRIVATE_KEY is in `.env` file
- Format must be: `0x` followed by 64 hex characters

---

## Step 3: Update .env File

After getting both Pinata JWT and NFT address, your `.env` should look like:

```env
# PINATA IPFS CONFIGURATION
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-jwt-token-here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# NFT CONTRACT DEPLOYMENT
NEXT_PUBLIC_NFT_ADDRESS=0x5f3f2d1c9e4a8b7f0c5d1e9a2f4c7d8e9f0c5d1
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Other settings
ERC721_DEPLOYMENT_API_URL=http://localhost:4001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_APP_NAME=MedicalNFT
```

⚠️ **Security Note**
- Never commit `.env` to Git (it's in `.gitignore`)
- Never share your PINATA_JWT or PRIVATE_KEY
- Rotate keys if accidentally exposed

---

## Step 4: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The application should now start without warnings.

---

## Step 5: Test the Application

### Patient Flow
1. ✅ Connect wallet (no warning about missing config)
2. ✅ Select "Patient" role
3. ✅ Mint an NFT (should show success)
4. ✅ Add a medical record
   - Select record type
   - Upload a PDF or image
   - Enter encryption password
   - Click "Add Record"
   - Should see success with IPFS links ✨

### Doctor Flow
1. ✅ Switch to "Doctor" role
2. ✅ Enter patient NFT ID
3. ✅ Check access (you need permission to proceed)
4. ✅ Decrypt and view records (need encryption key from patient)

---

## Complete Environment Variables Reference

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `PINATA_JWT` | ✅ Yes | IPFS file uploads | https://app.pinata.cloud/keys |
| `NEXT_PUBLIC_NFT_ADDRESS` | ✅ Yes | Patient NFT minting | `npm run deploy:erc721` |
| `PRIVATE_KEY` | ✅ Yes | Contract deployment | MetaMask → Account Details |
| `NEXT_PUBLIC_PINATA_GATEWAY` | ❌ Optional | IPFS gateway URL | Default: Pinata's public gateway |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ❌ Optional | Wallet connection | https://cloud.walletconnect.com |
| `ERC721_DEPLOYMENT_API_URL` | ❌ Optional | Local deployment API | Usually `http://localhost:4001` |
| `NEXT_PUBLIC_APP_NAME` | ❌ Optional | App name in wallet dialogs | Any string |

---

## Common Issues & Solutions

### Issue: "Contract Not Deployed" warning
**Solution**: 
- Run `npm run deploy:erc721`
- Add the returned address to `NEXT_PUBLIC_NFT_ADDRESS`
- Restart dev server: `npm run dev`

### Issue: "IPFS file upload error: IPFS upload failed"
**Solution**:
- Check `PINATA_JWT` is set in `.env`
- Make sure JWT token is complete (starts with `eyJ...`)
- Verify it's a valid JWT (not an API key)
- Restart dev server

### Issue: "Invalid file upload - must be encrypted"
**Solution**:
- This is a security feature
- Files are automatically encrypted client-side before upload
- No action needed - this is expected behavior

### Issue: "Pinata JWT is not configured"
**Solution**:
- Open `.env` file
- Add your Pinata JWT to `PINATA_JWT=`
- Don't add quotes around the token
- Restart dev server

### Issue: "Insufficient balance" during deployment
**Solution**:
- Go to Arbitrum Sepolia faucet: https://sepolia.arbitrum.io/
- Request more testnet ETH
- Wait a few minutes
- Try deployment again

---

## Next Steps

After completing setup:

1. **Test core features**
   - Mint NFT as patient
   - Add medical records
   - Grant doctor access
   - View activity logs

2. **Understand the platform**
   - Records are encrypted end-to-end
   - Only hashes stored on-chain (privacy)
   - Full medical files stored on IPFS
   - Doctors need your permission to access

3. **Deploy to production** (future)
   - Switch to Arbitrum mainnet
   - Use mainnet contract address
   - Use production Pinata credentials
   - Configure WalletConnect project ID

---

## Useful Links

- **Pinata**: https://app.pinata.cloud
- **Arbitrum Sepolia Faucet**: https://sepolia.arbitrum.io/
- **MetaMask**: https://metamask.io
- **WalletConnect**: https://cloud.walletconnect.com
- **IPFS**: https://ipfs.io

---

## Need Help?

- Check that files are valid (not corrupted)
- Make sure you're on Arbitrum Sepolia network
- Verify JWT token hasn't expired (create new one if needed)
- Check that wallet has funds for gas
- Review browser console (F12) for detailed errors

Good luck! 🚀
