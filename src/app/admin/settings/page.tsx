"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ClientApiError } from "@/lib/client-api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <PageHeader title="ตั้งค่า" crumbs={[{ href: user?.role === "ADMIN" ? "/admin" : "/dashboard", label: "แดชบอร์ด" }, { label: "ตั้งค่า" }]} />
      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>โปรไฟล์ผู้ใช้</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>ชื่อ: {user?.name}</p>
            <p>Username: {user?.username || "-"}</p>
            <p>อีเมล: {user?.email}</p>
            <p>สิทธิ์: {ROLE_LABEL[user?.role || ""]}</p>
            <p className="text-muted-foreground">ระบบไม่เก็บรูปภาพบุคลากร</p>
            <Button variant="outline" onClick={() => logout()}>ออกจากระบบ</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>เปลี่ยน PIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
                  toast.error("PIN ต้องเป็นตัวเลข 6 หลัก");
                  return;
                }
                setSaving(true);
                try {
                  await api("/api/auth/pin", {
                    method: "PATCH",
                    body: JSON.stringify({ currentPin, newPin }),
                  });
                  toast.success("เปลี่ยน PIN แล้ว");
                  setCurrentPin("");
                  setNewPin("");
                } catch (error) {
                  toast.error(error instanceof ClientApiError ? error.message : "เปลี่ยน PIN ไม่สำเร็จ");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <Label>PIN ปัจจุบัน</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={currentPin}
                  onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>PIN ใหม่</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <Button type="submit" disabled={saving}>บันทึก PIN</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
