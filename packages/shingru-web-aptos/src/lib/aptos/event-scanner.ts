/**
 * Aptos Event Scanner for Shingru
 * 
 * Scans blockchain for PaymentEvents and WithdrawEvents
 * to detect incoming payments and track balances
 */

import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import ShingruStealthAptos from "@/lib/@shingru/core/shingru-stealth-aptos";
import { isTestnet } from "@/config/chains";
import bs58 from "bs58";

export interface PaymentEventData {
  stealth_owner: string;
  payer: string;
  amount: string;
  label: Uint8Array;
  eph_pubkey: Uint8Array;
  payload: Uint8Array;
  note: Uint8Array;
  transaction_hash: string;
  event_index: number;
}

export interface ScannedPayment {
  stealthAddress: string;
  payer: string;
  amount: bigint;
  decryptedLabel: string;
  decryptedNote: string;
  payload: string;
  stealthPrivateKey: Uint8Array;
  ephemeralPubkey: string; // Base58 encoded ephemeral public key
  transactionHash: string;
  eventIndex: number;
}

export class AptosEventScanner {
  private aptos: Aptos;
  private shingru: ShingruStealthAptos;
  private contractAddress: string;

  constructor(contractAddress: string) {
    const network = isTestnet ? Network.TESTNET : Network.MAINNET;

    // Use the standard Aptos fullnode REST API (not GraphQL indexer)
    const config = new AptosConfig({
      network,
    });
    this.aptos = new Aptos(config);
    this.shingru = new ShingruStealthAptos();
    this.contractAddress = contractAddress;
  }

  /**
   * Query PaymentEvents by scanning recent module transactions
   * (events table was deprecated, using module account transaction scanning)
   */
  async queryPaymentEvents(
    coinType: string = "0x1::aptos_coin::AptosCoin",
    limit: number = 100,
    startVersion?: bigint
  ): Promise<PaymentEventData[]> {
    try {
      const eventType = `${this.contractAddress}::shingru_stealth::PaymentEvent<${coinType}>`;
      const paymentEvents: PaymentEventData[] = [];

      console.log(`🔍 queryPaymentEvents: Looking for event type: ${eventType}`);

      // Fetch recent transactions from the module account
      const moduleAddress = AccountAddress.fromString(this.contractAddress);
      
      console.log(`📡 Fetching transactions from module account: ${this.contractAddress}`);
      
      // Get account transactions using the REST API
      const transactions = await this.aptos.getAccountTransactions({
        accountAddress: moduleAddress,
        options: {
          limit,
        },
      });

      console.log(`📦 Retrieved ${transactions.length} transactions from module account`);

      // Scan through transactions and extract matching events
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        
        // Get transaction hash - Aptos SDK returns transactions with hash field
        let txHash = "";
        if (tx && typeof tx === 'object') {
          // Try different possible hash fields
          if ('hash' in tx && typeof tx.hash === 'string') {
            txHash = tx.hash;
          } else if ('transaction_hash' in tx && typeof tx.transaction_hash === 'string') {
            txHash = tx.transaction_hash;
          } else if ('version' in tx) {
            // If we have version, try to get full transaction by version to get hash
            try {
              const version = typeof tx.version === 'string' ? BigInt(tx.version) : BigInt(tx.version as any);
              const fullTx = await this.aptos.getTransactionByVersion({ ledgerVersion: version });
              if (fullTx && 'hash' in fullTx) {
                txHash = fullTx.hash as string;
              }
            } catch (e) {
              console.warn("Could not get transaction hash for version:", tx.version, e);
            }
          }
        }

        // Always get full transaction to ensure we have events
        let events: any[] = [];
        let fullTx: any = null;
        
        // First try to get events from the transaction object directly
        if ('events' in tx && Array.isArray(tx.events)) {
          events = tx.events;
        } else if (tx && typeof tx === 'object' && 'changes' in tx && Array.isArray(tx.changes)) {
          // Some transaction types have events in changes
          events = tx.changes.filter((c: any) => c.type === 'write_resource' && c.data?.events);
        }

        // If we don't have events, get full transaction by hash
        if (events.length === 0 && txHash) {
          try {
            console.log(`🔍 Fetching full transaction for hash: ${txHash}`);
            fullTx = await this.aptos.getTransactionByHash({ transactionHash: txHash });
            if (fullTx && 'events' in fullTx && Array.isArray(fullTx.events)) {
              events = fullTx.events;
              console.log(`📦 Found ${events.length} events in transaction ${txHash}`);
            }
          } catch (e) {
            console.warn(`⚠️ Could not get full transaction for hash ${txHash}:`, e);
            // Try by version if we have it
            if ('version' in tx) {
              try {
                const version = typeof tx.version === 'string' ? BigInt(tx.version) : BigInt(tx.version as any);
                fullTx = await this.aptos.getTransactionByVersion({ ledgerVersion: version });
                if (fullTx && 'events' in fullTx && Array.isArray(fullTx.events)) {
                  events = fullTx.events;
                  if ('hash' in fullTx) {
                    txHash = fullTx.hash as string;
                  }
                  console.log(`📦 Found ${events.length} events in transaction ${txHash} (by version)`);
                }
              } catch (e2) {
                console.warn(`⚠️ Could not get transaction by version ${tx.version}:`, e2);
              }
            }
          }
        }

        // Log all events for debugging
        if (events.length > 0) {
          console.log(`🔍 Processing ${events.length} events from transaction ${txHash}`);
          for (const event of events) {
            console.log(`  Event type: ${event.type}, Expected: ${eventType}`);
            if (event.type && event.type.includes('PaymentEvent')) {
              console.log(`  📦 PaymentEvent found! Data:`, event.data);
            }
          }
        }

        for (const event of events) {
          // Check if event type matches (exact match or contains PaymentEvent)
          const isPaymentEvent = event.type === eventType || 
            (event.type && event.type.includes('PaymentEvent') && event.type.includes(this.contractAddress));
          
          if (isPaymentEvent) {
            const data = event.data as any;
            console.log(`🔍 Processing PaymentEvent data:`, {
              hasStealthOwner: !!data?.stealth_owner,
              hasEphPubkey: !!data?.eph_pubkey,
              hasAmount: !!data?.amount,
              dataKeys: data ? Object.keys(data) : [],
            });
            
            if (data && data.stealth_owner && data.eph_pubkey) {
              console.log(`✅ Found payment event: stealth_owner=${data.stealth_owner}, amount=${data.amount}, tx=${txHash}`);
              paymentEvents.push({
                stealth_owner: data.stealth_owner,
                payer: data.payer || "",
                amount: data.amount?.toString() || "0",
                label: Array.isArray(data.label) ? new Uint8Array(data.label) : new Uint8Array(0),
                eph_pubkey: Array.isArray(data.eph_pubkey) ? new Uint8Array(data.eph_pubkey) : new Uint8Array(0),
                payload: Array.isArray(data.payload) ? new Uint8Array(data.payload) : new Uint8Array(0),
                note: Array.isArray(data.note) ? new Uint8Array(data.note) : new Uint8Array(0),
                transaction_hash: txHash || (tx.version?.toString() || "0"),
                event_index: parseInt(event.sequence_number || event.key?.creation_num || "0") || 0,
              });
            } else {
              console.warn(`⚠️ PaymentEvent missing required fields:`, {
                hasStealthOwner: !!data?.stealth_owner,
                hasEphPubkey: !!data?.eph_pubkey,
                data: data,
              });
            }
          }
        }
      }
      
      console.log(`📡 queryPaymentEvents: Found ${paymentEvents.length} payment events from ${transactions.length} transactions`);

      return paymentEvents;
    } catch (error) {
      console.error("Error querying payment events:", error);
      return [];
    }
  }

  /**
   * Scan payment events and decrypt if addressed to receiver
   */
  async scanPaymentEvents(
    paymentEvents: PaymentEventData[],
    metaViewPriv: Uint8Array,
    metaSpendPriv: Uint8Array
  ): Promise<ScannedPayment[]> {
    const ourPayments: ScannedPayment[] = [];

    for (const event of paymentEvents) {
      try {
        const scanned = await this.shingru.scanPaymentEvent(
          {
            stealth_owner: event.stealth_owner,
            payer: event.payer,
            amount: event.amount,
            label: event.label,
            eph_pubkey: event.eph_pubkey,
            payload: event.payload,
            note: event.note,
          },
          metaViewPriv,
          metaSpendPriv
        );

        if (scanned) {
          // Convert ephemeral pubkey to base58
          const ephemeralPubkeyB58 = bs58.encode(new Uint8Array(event.eph_pubkey));
          
          ourPayments.push({
            ...scanned,
            ephemeralPubkey: ephemeralPubkeyB58,
            transactionHash: event.transaction_hash,
            eventIndex: event.event_index,
          });
        }
      } catch (error) {
        console.error("Error scanning payment event:", error);
        continue;
      }
    }

    return ourPayments;
  }

  /**
   * Get account balance for a stealth address
   */
  async getStealthAddressBalance(
    stealthAddress: string,
    coinType: string = "0x1::aptos_coin::AptosCoin"
  ): Promise<bigint> {
    try {
      const address = AccountAddress.fromString(stealthAddress);
      const resources = await this.aptos.getAccountResources({ accountAddress: address });
      
      const coinResource = resources.find(
        (r) => r.type === `0x1::coin::CoinStore<${coinType}>`
      );

      if (!coinResource) {
        return 0n;
      }

      const data = coinResource.data as any;
      return BigInt(data.coin?.value || "0");
    } catch (error) {
      console.error("Error getting stealth address balance:", error);
      return 0n;
    }
  }

  /**
   * Helper: Convert Uint8Array to base58
   */
  private uint8ArrayToBase58(bytes: Uint8Array): string {
    return bs58.encode(bytes);
  }
}

