# QIP (Qubic ICO Portal)

**QIP** is a **native, fully on-chain ICO launchpad smart contract** designed for the Qubic network. It enables projects to run **secure, structured, multi-phase token sales** using Qubic’s existing **QX asset and share system**, without off-chain coordination or custodial risk.

QIP is intended as **reusable ecosystem infrastructure**, not a one-off contract.

---

## Core Features

### 🔹 Structured Multi-Phase ICOs

* Up to **3 sale phases**, each with:

  * Independent token price
  * Independent supply cap
* Phases advance automatically by **epoch**
* Unsold tokens **roll over** between phases

### 🔹 On-Chain Token Management

* Uses **QX asset system**
* Issuer transfers:

  * Full token supply
  * Share management rights
* Tokens are distributed **instantly** to buyers

### 🔹 Automated Fund Distribution

* Sale proceeds are split automatically:

  * **95%** → up to **10 configurable payout addresses**
  * **5%** → **Qubic Smart Contract Shareholders** (via dividend distribution)
* Percentages are enforced on-chain (must sum to exactly 95%)

### 🔹 Trustless & Secure

* No external escrow
* No manual payouts
* No off-chain logic
* Unsold tokens after final phase are:

  * Returned to the creator
  * ICO entry is removed from state

### 🔹 Share & Ownership Controls

* Supports **share ownership & possession transfers**
* Includes a procedure for **transferring share management rights**
* Fee-protected to prevent abuse

## Technical Highlights

### Smart Contract

* Language: **C++ (Qubic QPI)**
* Max ICOs: **1024**
* No external dependencies
* Fully deterministic execution

### Safety & Validation

* Enforced checks for:

  * Invalid epochs
  * Invalid prices
  * Invalid sale amounts
  * Invalid payout percentages
  * Overflow protection
  * Insufficient payment
* Tested against **20+ edge cases**

### On-Chain Automation

* Epoch-based phase transitions
* Automatic cleanup after final phase
* Dividend distribution handled natively

---

## Requirements to Deploy on Qubic

* Permission to deploy **QIP Smart Contract**
* Access to:

  * QX asset system
  * Dividend distribution mechanism
* No protocol changes required
* Fully compatible with existing Qubic architecture

---

## Value to the Qubic Ecosystem

* Enables **real, native ICOs**
* Removes need for:

  * Centralized sales
  * Manual fund handling
* Increases:

  * Asset creation
  * Network activity
  * Developer adoption
* Establishes Qubic as a **serious launchpad platform**
