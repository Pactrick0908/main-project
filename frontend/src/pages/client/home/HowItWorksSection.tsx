const HOW_STEPS = [
  {
    icon: "🎫",
    title: "Tìm sự kiện",
    desc: "Xem danh sách concert, festival đang diễn ra. Mua vé trực tiếp từ nhà tổ chức.",
  },
  {
    icon: "🔄",
    title: "Không đi được? Pass lại",
    desc: "Lỡ mua vé mà có việc bận? Đăng lên Chợ vé để nhường cho người khác cần.",
  },
  {
    icon: "🛡️",
    title: "Giao dịch được bảo vệ",
    desc: "Tiền của người mua được giữ an toàn — chỉ thanh toán cho người bán sau khi check-in thành công.",
  },
  {
    icon: "✅",
    title: "Vào cổng dễ dàng",
    desc: "Quét mã QR tại cổng. Vé tự động xác nhận — không lo vé giả, không lo tranh chấp.",
  },
];
function HowItWorksSection() {
  return (
    <section className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-white">
            Hoạt động như thế nào?
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Đơn giản từ đầu đến cuối — không cần biết gì thêm
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px bg-zinc-800/60 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="bg-[#090A0F] p-6">
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
