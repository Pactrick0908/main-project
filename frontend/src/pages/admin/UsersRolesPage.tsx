import { useCallback, useEffect, useState } from "react";
import { Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminApi,
  type AdminStaffUser,
  type AssignableRoleInfo,
} from "@/api/admin.api";
import { toast } from "@/lib/toast";
import { AdminPageShell } from "@/layouts/admin/HeaderAdmin";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  organizer: "Nhà tổ chức",
  customer: "Khách",
  scanner: "Scanner",
};

export default function UsersRolesPage() {
  const [q, setQ] = useState("");
  const [roles, setRoles] = useState<AssignableRoleInfo[]>([]);
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const refresh = useCallback(async (query?: string) => {
    setError(null);
    try {
      const [roleRes, userRes] = await Promise.all([
        adminApi.listRoles(),
        adminApi.listUsers(query),
      ]);
      setRoles(roleRes.data.roles);
      setUsers(userRes.data.users);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSearch = async () => {
    setLoading(true);
    await refresh(q.trim() || undefined);
  };

  const handleAssign = async (userId: number, role: string) => {
    setSavingId(userId);
    try {
      const res = await adminApi.assignUserRole(userId, role);
      toast.success(res.message || `Đã gán ${role}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...res.data.user } : u)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gán quyền thất bại");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminPageShell
      title="Phân quyền người dùng"
      description="Admin gán role: admin / manager / nhà tổ chức / khách"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh(q.trim() || undefined)}
      showCreateEvent={false}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-primary" />
              Ma trận quyền
            </CardTitle>
            <CardDescription>
              Admin: full + phân quyền · Manager: vận hành, ẩn doanh thu · Nhà
              tổ chức: chỉ xem doanh thu
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles
              .filter((r) =>
                ["admin", "manager", "organizer"].includes(r.name),
              )
              .map((r) => (
                <div
                  key={r.name}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                >
                  <p className="text-sm font-semibold">
                    {ROLE_LABEL[r.name] ?? r.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {r.permissions.join(" · ") || "(không có)"}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Danh sách tài khoản</CardTitle>
              <CardDescription>
                Tìm theo email / tên, rồi chọn role mới
              </CardDescription>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email hoặc tên…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSearch();
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSearch()}
              >
                <Search className="size-4" />
                Tìm
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Người dùng</th>
                  <th className="pb-2 pr-3 font-medium">Role hiện tại</th>
                  <th className="pb-2 font-medium">Gán quyền</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/70">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {["admin", "manager", "organizer", "customer"].map(
                          (role) => (
                            <Button
                              key={role}
                              type="button"
                              size="xs"
                              variant={u.role === role ? "default" : "outline"}
                              disabled={
                                savingId === u.id || u.role === role
                              }
                              onClick={() => void handleAssign(u.id, role)}
                            >
                              {ROLE_LABEL[role] ?? role}
                            </Button>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Không có user. Người dùng đăng nhập Google sẽ xuất hiện
                      tại đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
