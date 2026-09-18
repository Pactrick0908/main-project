import { useCallback, useEffect, useMemo, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminApi,
  type RbacCatalog,
  type RbacScopeType,
} from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import type { ConfirmModalState } from "@/pages/admin/adminShared";
import {
  AdminPageShell,
  AdminConfirmModal,
} from "@/layouts/admin/HeaderAdmin";
import { toast } from "@/lib/toast";

const SCOPE_LABEL: Record<RbacScopeType, string> = {
  GLOBAL: "Toàn sàn",
  ORGANIZER: "Ban tổ chức",
  EVENT: "Sự kiện",
};

function suggestedScope(
  role: RbacCatalog["roles"][number] | undefined,
): RbacScopeType {
  if (!role) return "ORGANIZER";
  if (role.globalOnly) return "GLOBAL";
  if (role.eventOnly) return "EVENT";
  return "ORGANIZER";
}

export default function RbacPage() {
  const { isAuthenticated } = useAuth();

  const [catalog, setCatalog] = useState<RbacCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);

  const [userQuery, setUserQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [scopeType, setScopeType] = useState<RbacScopeType>("ORGANIZER");
  const [scopeId, setScopeId] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await adminApi.rbacCatalog();
      const data = res.data;
      if (!data?.roles) {
        throw new Error("API phân quyền trả về dữ liệu không hợp lệ");
      }
      setCatalog(data);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được phân quyền",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
  }, [isAuthenticated, refresh]);

  const assignableRoles = catalog?.roles.filter((r) => r.assignable) ?? [];
  const selectedAssignRole = assignableRoles.find(
    (r) => r.id === Number(roleId),
  );

  useEffect(() => {
    if (!selectedAssignRole) return;
    setScopeType(suggestedScope(selectedAssignRole));
    setScopeId("");
  }, [selectedAssignRole?.id]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const users = catalog?.users ?? [];
    if (!q) return users.slice(0, 40);
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id) === q,
      )
      .slice(0, 40);
  }, [catalog?.users, userQuery]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = Number(userId);
    const rid = Number(roleId);
    if (!Number.isInteger(uid) || uid < 1 || !Number.isInteger(rid) || rid < 1) {
      toast.error("Chọn người dùng và vai trò");
      return;
    }
    if (scopeType !== "GLOBAL") {
      const sid = Number(scopeId);
      if (!Number.isInteger(sid) || sid < 1) {
        toast.error(
          scopeType === "EVENT" ? "Chọn sự kiện" : "Chọn ban tổ chức",
        );
        return;
      }
    }
    setBusy(true);
    try {
      await adminApi.assignRole({
        userId: uid,
        roleId: rid,
        scopeType,
        scopeId: scopeType === "GLOBAL" ? 0 : Number(scopeId),
      });
      toast.success("Đã gán vai trò");
      setUserId("");
      setUserQuery("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gán vai trò thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = (a: RbacCatalog["assignments"][number]) => {
    setModal({
      kind: "confirm",
      title: "Thu hồi vai trò",
      description: `Thu hồi "${a.roleLabel}" của ${a.user.fullName} (${SCOPE_LABEL[a.scopeType]})?`,
      confirmLabel: "Thu hồi",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await adminApi.revokeRole({
          userId: a.userId,
          roleId: a.roleId,
          scopeType: a.scopeType,
          scopeId: a.scopeId,
        });
        toast.success("Đã thu hồi vai trò");
        setModal(null);
        await refresh();
      },
    });
  };

  const scopeOptions =
    scopeType === "EVENT"
      ? (catalog?.events ?? []).map((ev) => ({
          id: ev.id,
          label: `#${ev.id} ${ev.title}`,
        }))
      : (catalog?.organizers ?? []).map((o) => ({
          id: o.id,
          label: `#${o.id} ${o.fullName} · ${o.email}`,
        }));

  return (
    <AdminPageShell
      title="Phân quyền"
      description="Gán Super Admin, Organizer hoặc Scanner cho tài khoản"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      showCreateEvent={false}
    >
      <div className="space-y-6">
        {catalog && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gán vai trò</CardTitle>
                <CardDescription>
                  Super Admin — toàn sàn. Organizer — theo ban tổ chức / sự kiện
                  của BTC. Scanner — theo sự kiện, chỉ vào máy quét.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => void handleAssign(e)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[12px] font-medium">Người dùng</label>
                    <Input
                      placeholder="Tìm tên, email hoặc ID…"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                    />
                    <select
                      className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    >
                      <option value="">Chọn người dùng</option>
                      {filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          #{u.id} {u.fullName} · {u.email}
                          {u.legacyRole ? ` (${u.legacyRole})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium">Vai trò</label>
                    <select
                      className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                    >
                      <option value="">Chọn role</option>
                      {assignableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label} ({(r.code ?? r.name).toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium">Phạm vi</label>
                    <select
                      className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
                      value={scopeType}
                      disabled={
                        selectedAssignRole?.globalOnly ||
                        selectedAssignRole?.eventOnly
                      }
                      onChange={(e) => {
                        setScopeType(e.target.value as RbacScopeType);
                        setScopeId("");
                      }}
                    >
                      {!selectedAssignRole?.eventOnly && (
                        <option
                          value="GLOBAL"
                          disabled={!selectedAssignRole?.globalOnly}
                        >
                          Toàn sàn
                        </option>
                      )}
                      {!selectedAssignRole?.globalOnly &&
                        !selectedAssignRole?.eventOnly && (
                          <option value="ORGANIZER">Ban tổ chức</option>
                        )}
                      {!selectedAssignRole?.globalOnly && (
                        <option value="EVENT">Sự kiện</option>
                      )}
                    </select>
                  </div>

                  {scopeType !== "GLOBAL" && (
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[12px] font-medium">
                        {scopeType === "EVENT" ? "Sự kiện" : "Ban tổ chức"}
                      </label>
                      <select
                        className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
                        value={scopeId}
                        onChange={(e) => setScopeId(e.target.value)}
                      >
                        <option value="">
                          Chọn {scopeType === "EVENT" ? "sự kiện" : "BTC"}
                        </option>
                        {scopeOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={busy} size="sm">
                      <UserPlus className="size-3.5" />
                      {busy ? "Đang gán…" : "Gán vai trò"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đang gán</CardTitle>
                <CardDescription>
                  {catalog.assignments.length} assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {catalog.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có ai được gán role.
                  </p>
                ) : (
                  <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="pb-2 font-medium">Người dùng</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Phạm vi</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {catalog.assignments.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2.5 pr-3">
                            <p className="font-medium">{a.user.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {a.user.email}
                            </p>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge variant="secondary" className="rounded-md">
                              {a.roleLabel}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {SCOPE_LABEL[a.scopeType]}
                            {a.event ? ` · ${a.event.title}` : ""}
                            {a.organizer ? ` · ${a.organizer.fullName}` : ""}
                            {a.scopeType === "GLOBAL"
                              ? ""
                              : a.event || a.organizer
                                ? ""
                                : ` · #${a.scopeId}`}
                          </td>
                          <td className="py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRevoke(a)}
                              title="Thu hồi"
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
