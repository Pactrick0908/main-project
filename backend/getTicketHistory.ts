import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

/**
 * Hàm truy xuất lịch sử các vé đã được mint từ Smart Contract (Program ID) trên Solana Devnet.
 * Thích hợp làm Express/Next.js Middleware hoặc API Handler.
 * 
 * @param {string} programIdStr - Địa chỉ Program ID (Mặc định: 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H')
 * @param {number} limit - Số lượng giao dịch tối đa cần lấy (Mặc định: 20)
 * @returns {Promise<Array<Object>>} Danh sách thông tin vé đã mint
 */
export async function getTicketMintHistory(
  programIdStr = 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H',
  limit = 20
) {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const programId = new PublicKey(programIdStr);

    // 1. Lấy danh sách giao dịch gần đây của Program ID
    const signatures = await connection.getSignaturesForAddress(programId, { limit });

    if (!signatures || signatures.length === 0) {
      return [];
    }

    // 2. Lấy chi tiết từng giao dịch và parse log
    const ticketHistory = await Promise.all(
      signatures.map(async (sigInfo) => {
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) return null;

        const logs = tx.meta?.logMessages || [];
        
        // Trích xuất log chứa thông tin vé đã tạo
        let eventName = 'Không xác định';
        let isCreateTicketInstruction = false;

        logs.forEach((log) => {
          if (log.includes('Instruction: CreateTicket')) {
            isCreateTicketInstruction = true;
          }
          if (log.includes('Ve da duoc tao thanh cong cho su kien:')) {
            eventName = log.replace(/.*Ve da duoc tao thanh cong cho su kien:\s*/, '').trim();
          }
        });

        return {
          signature: sigInfo.signature,
          slot: sigInfo.slot,
          blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
          status: tx.meta?.err === null ? 'SUCCESS' : 'FAILED',
          isCreateTicket: isCreateTicketInstruction,
          eventName,
          explorerUrl: `https://explorer.solana.com/tx/${sigInfo.signature}?cluster=devnet`,
          logs,
        };
      })
    );

    // Lọc ra các giao dịch hợp lệ
    return ticketHistory.filter((ticket) => ticket !== null);
  } catch (error) {
    console.error('Lỗi khi truy xuất lịch sử vé từ Solana Devnet:', error);
    throw error;
  }
}

/**
 * Middleware ví dụ cho Express JS
 */
export async function ticketHistoryMiddleware(req, res, next) {
  try {
    const history = await getTicketMintHistory();
    req.ticketHistory = history;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Không thể truy xuất lịch sử vé từ Solana Devnet' });
  }
}
