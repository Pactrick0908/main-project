import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function main() {
  const programIdStr = 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H';
  const programId = new PublicKey(programIdStr);
  
  console.log('=== 1. CHECK PROGRAM ACCOUNT ===');
  try {
    const info = await connection.getAccountInfo(programId);
    if (info) {
      console.log('Program ID:', programIdStr);
      console.log('Executable:', info.executable);
      console.log('Owner (Loader):', info.owner.toBase58());
      console.log('Lamports Balance:', info.lamports / 1e9, 'SOL');
      console.log('Data Length:', info.data.length, 'bytes');
    } else {
      console.log('Account not found on Devnet!');
    }
  } catch (err) {
    console.error('Error checking program:', err.message);
  }

  const txSig = '5Hu6qVCLkvKzLKHZY6xBqjLbsRbxzioSyKLBNHXCXzmraJMDSionsj9wFB2nRi3TnvHXnsT8ois49ayVAQxsjHx4';
  console.log('\n=== 2. CHECK TRANSACTION ===');
  try {
    const tx = await connection.getTransaction(txSig, { maxSupportedTransactionVersion: 0 });
    if (!tx) {
      console.log('Transaction not found on Devnet');
    } else {
      console.log('Tx Signature:', txSig);
      console.log('Slot:', tx.slot);
      console.log('BlockTime:', tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString('vi-VN') : null);
      console.log('Status:', tx.meta?.err === null ? 'SUCCESS' : 'FAILED', tx.meta?.err || '');
      console.log('Logs:');
      if (tx.meta?.logMessages) {
        tx.meta.logMessages.forEach((log, index) => console.log(`  [${index}] ${log}`));
      } else {
        console.log('  No logs found');
      }
    }
  } catch (err) {
    console.error('Error checking transaction:', err.message);
  }

  console.log('\n=== 3. CHECK RECENT SIGNATURES FOR PROGRAM ===');
  try {
    const signatures = await connection.getSignaturesForAddress(programId, { limit: 10 });
    console.log(`Found ${signatures.length} recent transactions for program:`);
    signatures.forEach((sig, index) => {
      console.log(`  [${index + 1}] Sig: ${sig.signature} | Slot: ${sig.slot} | Err: ${sig.err}`);
    });
  } catch (err) {
    console.error('Error getting signatures:', err.message);
  }
}

main();
