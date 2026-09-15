'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type TabType = 'dashboard' | 'events' | 'tickets';

export interface RealTicketItem {
  id: string;
  tx_hash: string;
  event_name: string;
  is_checked_in: boolean;
  buyer_wallet?: string;
  time: string;
  explorer_url: string;
  price_vnd?: number;
}

export interface EventItem {
  id: string;
  name: string;
  location: string;
  date: string;
  priceVnd: number;
  totalTickets: number;
  soldTickets: number;
  posterUrl: string;
  status: 'active' | 'upcoming' | 'ended';
  merkleTreeAddress: string;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [tickets, setTickets] = useState<RealTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'EVT-001',
      name: 'Đêm Nhạc Indie 2025 (Solana Live)',
      location: 'Sân vận động Mỹ Đình, Hà Nội',
      date: '26/08/2026',
      priceVnd: 1500000,
      totalTickets: 100,
      soldTickets: 5,
      posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      merkleTreeAddress: 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H',
    },
    {
      id: 'EVT-002',
      name: 'Rap Việt All-Star Concert 2026',
      location: 'SECC, Q.7, TP. HCM',
      date: '15/11/2026',
      priceVnd: 2200000,
      totalTickets: 1500,
      soldTickets: 980,
      posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      status: 'upcoming',
      merkleTreeAddress: 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H',
    },
  ]);

  // Form State
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    date: '',
    priceVnd: '',
    totalTickets: '',
    posterUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRealTicketsData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) throw new Error('Failed to fetch ticket data');
      const data = await res.json();
      setTickets(data.tickets || []);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTicketsData(true);
    const intervalId = setInterval(() => {
      fetchRealTicketsData(false);
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.priceVnd || !newEvent.totalTickets) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created: EventItem = {
        id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
        name: newEvent.name,
        location: newEvent.location || 'Địa điểm TBD',
        date: newEvent.date || 'TBD',
        priceVnd: Number(newEvent.priceVnd),
        totalTickets: Number(newEvent.totalTickets),
        soldTickets: 0,
        posterUrl: newEvent.posterUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
        status: 'active',
        merkleTreeAddress: 'GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H',
      };

      setEvents([created, ...events]);
      setNewEvent({ name: '', location: '', date: '', priceVnd: '', totalTickets: '', posterUrl: '' });
      setIsSubmitting(false);
      alert('Tạo sự kiện thành công & Đã đăng ký với Program ID GGadYLQQ...bq1H!');
    }, 400);
  };

  const handleDeleteEvent = (eventId: string, eventName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sự kiện "${eventName}"?`)) {
      setEvents(events.filter((evt) => evt.id !== eventId));
    }
  };

  const handleEventStatusChange = (eventId: string, newStatus: 'active' | 'upcoming' | 'ended') => {
    setEvents(events.map((evt) => (evt.id === eventId ? { ...evt, status: newStatus } : evt)));
  };

  const handleQuickCheckIn = (txHash: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.tx_hash === txHash ? { ...t, is_checked_in: true } : t))
    );
  };

  const totalTicketsSold = tickets.length;
  const checkedInCount = tickets.filter((t) => t.is_checked_in).length;
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.price_vnd || 1500000), 0);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shadow-xl flex-shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              T3
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide">Ticket3</h1>
              <div className="text-xs text-purple-400 font-medium">Solana Devnet</div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold ${
                activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold ${
                activeTab === 'events' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Quản lý Sự kiện ({events.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold ${
                activeTab === 'tickets' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Vé đã bán (Live Devnet)</span>
            </button>
          </nav>
        </div>

        <div className="p-4 m-4 bg-slate-800/60 rounded-xl border border-slate-800 text-xs">
          <div className="text-slate-400 mb-1">Program ID</div>
          <a
            href="https://explorer.solana.com/address/GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-purple-300 font-semibold hover:underline block truncate"
          >
            GGadYLQQ5S...395kbq1H
          </a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('events')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-700 flex items-center gap-1"
            >
              <span>+</span> Thêm Sự Kiện Mới
            </button>
            <a
              href="/admin/scanner"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow hover:bg-purple-700"
            >
              📷 Trạm Soát Vé QR 30s
            </a>
          </div>
        </header>

        <main className="p-8 space-y-8 flex-1">
          {isLoading && (
            <div className="bg-purple-50 border border-purple-200 text-purple-800 px-6 py-4 rounded-2xl">
              Đang tải dữ liệu từ Solana Devnet...
            </div>
          )}

          {!isLoading && activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tổng doanh thu</span>
                  <div className="mt-4 text-2xl font-extrabold text-slate-900">{formatVND(totalRevenue)}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tổng vé đã bán</span>
                  <div className="mt-4 text-2xl font-extrabold text-slate-900">{totalTicketsSold} vé</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Đã Check-in</span>
                  <div className="mt-4 text-2xl font-extrabold text-slate-900">{checkedInCount} / {totalTicketsSold}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Sự kiện On-chain</span>
                  <div className="mt-4 text-2xl font-extrabold text-slate-900">{events.length} Sự kiện</div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl text-white flex items-center justify-between shadow-lg">
                <div>
                  <h3 className="text-lg font-bold">Thêm sự kiện / chương trình mới</h3>
                  <p className="text-xs text-slate-400 mt-1">Đăng ký sự kiện mới và liên kết với Solana Devnet Program ID</p>
                </div>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  + Thêm Sự Kiện Mới Ngay
                </button>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'events' && (
            <div className="space-y-8">
              {/* FORM THÊM SỰ KIỆN MỚI NỔI BẬT */}
              <div className="bg-white rounded-2xl border border-purple-200 shadow-md p-6 border-t-4 border-t-purple-600">
                <div className="border-b border-slate-100 pb-3 mb-6">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                    THÊM SỰ KIỆN / CHƯƠNG TRÌNH MỚI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Nhập thông tin bên dưới để khởi tạo chương trình mới và đăng ký lên Solana Devnet.
                  </p>
                </div>

                <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Tên sự kiện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Concert Anh Trai Vượt Ngàn Chông Gai 2026"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Địa điểm & Thời gian
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Sân vận động Mỹ Đình"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <input
                        type="text"
                        placeholder="26/08/2026"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Giá vé niêm yết (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="1500000"
                      value={newEvent.priceVnd}
                      onChange={(e) => setNewEvent({ ...newEvent, priceVnd: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Số lượng vé (Total Supply) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={newEvent.totalTickets}
                      onChange={(e) => setNewEvent({ ...newEvent, totalTickets: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Link URL ảnh Banner / Poster
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newEvent.posterUrl}
                      onChange={(e) => setNewEvent({ ...newEvent, posterUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition"
                    >
                      {isSubmitting ? 'Đang tạo...' : '+ Tạo Sự Kiện Mới Ngay'}
                    </button>
                  </div>
                </form>
              </div>

              {/* BẢNG DANH SÁCH SỰ KIỆN */}
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Danh sách Sự kiện đã tạo ({events.length})</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                      <th className="p-4">Tên Sự kiện</th>
                      <th className="p-4">Giá vé</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Đổi / Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {events.map((evt) => (
                      <tr key={evt.id}>
                        <td className="p-4 font-bold text-slate-900">{evt.name}</td>
                        <td className="p-4 font-semibold">{formatVND(evt.priceVnd)}</td>
                        <td className="p-4">
                          {evt.status === 'active' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">🟢 Đang diễn ra</span>}
                          {evt.status === 'upcoming' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">🔵 Sắp diễn ra</span>}
                          {evt.status === 'ended' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">⚪ Đã kết thúc</span>}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <select
                            value={evt.status}
                            onChange={(e) => handleEventStatusChange(evt.id, e.target.value as any)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white"
                          >
                            <option value="active">🟢 Đang diễn ra</option>
                            <option value="upcoming">🔵 Sắp diễn ra</option>
                            <option value="ended">⚪ Đã kết thúc</option>
                          </select>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.name)}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-600 hover:text-white"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'tickets' && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Vé đã bán từ Devnet</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                    <th className="p-4">Tx Hash (Chữ ký Solana)</th>
                    <th className="p-4">Sự kiện</th>
                    <th className="p-4">Check-in</th>
                    <th className="p-4 text-right">Thao tác Real-time / Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {tickets.map((t) => (
                    <tr key={t.tx_hash}>
                      <td className="p-4 font-mono font-bold text-purple-600">{t.tx_hash.substring(0, 10)}...</td>
                      <td className="p-4 font-semibold">{t.event_name}</td>
                      <td className="p-4">
                        {t.is_checked_in ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">🟢 Đã vào</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">🟡 Chưa vào</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!t.is_checked_in && (
                          <button
                            onClick={() => handleQuickCheckIn(t.tx_hash)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                          >
                            ⚡ Check-in Nhanh
                          </button>
                        )}
                        <a
                          href={`https://explorer.solana.com/tx/${t.tx_hash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-600 hover:text-white border border-purple-200"
                        >
                          Solana Explorer &rarr;
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
