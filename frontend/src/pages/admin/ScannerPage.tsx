import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    BrowserMultiFormatReader,
    BarcodeFormat,
    type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { ticketApi, type QrPayload, type TicketDto } from "@/api/ticket.api";

type ScanResult =
    | { ok: true; message: string; ticket: TicketDto }
    | { ok: false; message: string; ticket?: TicketDto };

function createReader() {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");
    return new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 2000,
    });
}

export default function ScannerPage() {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [manual, setManual] = useState("");
    const [photoBusy, setPhotoBusy] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const lastRaw = useRef("");
    const verifying = useRef(false);
    const handlePayloadRef = useRef<(raw: string) => Promise<void>>(
        async () => {},
    );

    const handlePayload = useCallback(async (raw: string) => {
        if (!raw || verifying.current) return;
        if (raw === lastRaw.current) return;

        let payload: QrPayload;
        try {
            payload = JSON.parse(raw) as QrPayload;
            if (!payload.ticketId || !payload.nonce || !payload.signature) {
                throw new Error("missing fields");
            }
        } catch {
            setResult({ ok: false, message: "QR không đúng định dạng vé" });
            return;
        }

        verifying.current = true;
        lastRaw.current = raw;
        setBusy(true);

        try {
            const res = await ticketApi.verify(payload);
            setResult({
                ok: true,
                message: res.message,
                ticket: res.data.ticket,
            });
        } catch (err: unknown) {
            const e = err as {
                message?: string;
                data?: { ticket?: TicketDto };
            };
            setResult({
                ok: false,
                message: e?.message ?? "Từ chối",
                ticket: e?.data?.ticket,
            });
        } finally {
            setBusy(false);
            window.setTimeout(() => {
                verifying.current = false;
                lastRaw.current = "";
            }, 2500);
        }
    }, []);

    handlePayloadRef.current = handlePayload;

    useEffect(() => {
        let cancelled = false;
        let controls: IScannerControls | null = null;
        const reader = createReader();

        const start = async () => {
            const video = videoRef.current;
            if (!video) return;

            try {
                controls = await reader.decodeFromConstraints(
                    {
                        audio: false,
                        video: {
                            facingMode: { ideal: "environment" },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        },
                    },
                    video,
                    (zxingResult, _err, ctrl) => {
                        if (cancelled) {
                            ctrl.stop();
                            return;
                        }
                        if (zxingResult) {
                            void handlePayloadRef.current(zxingResult.getText());
                        }
                    },
                );

                if (cancelled) {
                    controls.stop();
                    return;
                }

                setCameraOn(true);
                setCameraError(null);
            } catch (err) {
                console.error(err);
                if (cancelled) return;
                setCameraOn(false);
                setCameraError(
                    "Không mở được camera. Cần HTTPS, cho phép quyền camera, rồi tải lại. Hoặc dùng nút Chụp ảnh QR bên dưới.",
                );
            }
        };

        void start();

        return () => {
            cancelled = true;
            try {
                controls?.stop();
            } catch {
                /* ignore */
            }
            BrowserMultiFormatReader.releaseAllStreams();
        };
    }, []);

    const onPickPhoto = async (file: File | null) => {
        if (!file) return;
        setPhotoBusy(true);
        setCameraError(null);
        const url = URL.createObjectURL(file);
        try {
            const reader = createReader();
            const zxingResult = await reader.decodeFromImageUrl(url);
            await handlePayload(zxingResult.getText());
        } catch (err) {
            console.error(err);
            setResult({
                ok: false,
                message:
                    "Không đọc được QR từ ảnh. Chụp gần hơn, đủ sáng, không bị mờ.",
            });
        } finally {
            URL.revokeObjectURL(url);
            setPhotoBusy(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const tone =
        result?.ok === true ? "ok" : result?.ok === false ? "bad" : "idle";
    const bg =
        tone === "ok" ? "#059669" : tone === "bad" ? "#b91c1c" : "#0b0f14";

    return (
        <div
            style={{ background: bg, color: "#fff", minHeight: "100vh" }}
            className="transition-colors duration-300"
        >
            <header className="flex items-center justify-between px-4 py-4 sm:px-8">
                <div>
                    <Link
                        to="/admin"
                        className="text-sm text-white/70 hover:text-white"
                    >
                        ← Admin
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Trạm soát vé
                    </h1>
                    <p className="text-sm text-white/70">
                        QR động · TTL 60 giây · hỗ trợ iPhone
                    </p>
                </div>
                {busy && (
                    <span className="animate-pulse text-sm">
                        Đang xác thực…
                    </span>
                )}
            </header>

            <main className="mx-auto grid max-w-5xl gap-6 px-4 pb-10 sm:grid-cols-2 sm:px-8">
                <section className="overflow-hidden rounded-2xl bg-black/30 p-3 ring-1 ring-white/15">
                    <video
                        ref={videoRef}
                        className="aspect-video w-full rounded-xl bg-black object-cover"
                        muted
                        playsInline
                        autoPlay
                    />
                    {!cameraOn && !cameraError && (
                        <p className="mt-3 px-2 text-sm text-white/60">
                            Đang bật camera…
                        </p>
                    )}
                    {cameraError && (
                        <p className="mt-3 px-2 text-sm text-amber-100">
                            {cameraError}
                        </p>
                    )}
                    <div className="mt-3 flex gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) =>
                                void onPickPhoto(e.target.files?.[0] ?? null)
                            }
                        />
                        <button
                            type="button"
                            disabled={photoBusy}
                            onClick={() => fileRef.current?.click()}
                            className="flex-1 rounded-lg bg-white/15 py-2.5 text-sm font-medium hover:bg-white/25 disabled:opacity-50"
                        >
                            {photoBusy ? "Đang đọc ảnh…" : "Chụp / chọn ảnh QR"}
                        </button>
                    </div>
                    <p className="mt-2 px-1 text-xs text-white/50">
                        iPhone: nếu cam live không bắt được, dùng nút chụp ảnh
                        phía trên (ổn định hơn với QR dày).
                    </p>
                </section>

                <section className="flex flex-col justify-center rounded-2xl bg-black/25 p-6 ring-1 ring-white/15">
                    {!result ? (
                        <div className="text-center">
                            <p className="text-5xl font-bold tracking-tight text-white/90">
                                SẴN SÀNG
                            </p>
                            <p className="mt-3 text-white/60">
                                Đưa mã QR trên điện thoại khách vào khung hình
                            </p>
                        </div>
                    ) : result.ok ? (
                        <div className="text-center">
                            <p className="text-6xl font-black tracking-tight">
                                HỢP LỆ
                            </p>
                            <p className="mt-3 text-lg">{result.message}</p>
                            {result.ticket && (
                                <div className="mt-6 space-y-1 text-left text-base">
                                    <p>
                                        <span className="text-white/60">
                                            Khách:
                                        </span>{" "}
                                        {result.ticket.ownerName ?? "—"}
                                    </p>
                                    <p>
                                        <span className="text-white/60">
                                            Sự kiện:
                                        </span>{" "}
                                        {result.ticket.event.title}
                                    </p>
                                    <p>
                                        <span className="text-white/60">
                                            Hạng:
                                        </span>{" "}
                                        {result.ticket.zoneName}
                                        {result.ticket.seatLabel
                                            ? ` · Ghế ${result.ticket.seatLabel}`
                                            : ""}
                                    </p>
                                    <p>
                                        <span className="text-white/60">
                                            Vé #:
                                        </span>{" "}
                                        {result.ticket.id}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-6xl font-black tracking-tight">
                                TỪ CHỐI
                            </p>
                            <p className="mt-3 text-lg">{result.message}</p>
                        </div>
                    )}

                    <div className="mt-8 border-t border-white/15 pt-4">
                        <label className="text-xs uppercase tracking-wider text-white/50">
                            Dán JSON QR (fallback)
                        </label>
                        <textarea
                            value={manual}
                            onChange={(e) => setManual(e.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-lg bg-black/40 p-3 font-mono text-xs text-white outline-none ring-1 ring-white/20 focus:ring-white/40"
                            placeholder='{"ticketId":1,"ownerPubkey":"...","nonce":"...","expiresAt":...,"signature":"..."}'
                        />
                        <button
                            type="button"
                            onClick={() => void handlePayload(manual.trim())}
                            className="mt-2 w-full rounded-lg bg-white/15 py-2 text-sm font-medium hover:bg-white/25"
                        >
                            Xác thực thủ công
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
