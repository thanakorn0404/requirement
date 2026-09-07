"use client";

import { useMemo, useState } from "react";
import { Briefcase, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersonDTO, PositionDTO } from "@/types";

const PRESET_ROLES = [
  "ธุรการกลาง",
  "หัวหน้าสำนัก",
  "ธุรการกอง",
  "เจ้าหน้าที่",
  "ธุรการงาน",
  "หัวหน้างาน",
  "หัวหน้าฝ่าย",
  "ผู้อำนวยการกอง",
  "ปลัด",
  "นายก",
];

export function WorkflowSidebar({
  positions,
  persons,
}: {
  positions: PositionDTO[];
  persons: PersonDTO[];
}) {
  const [search, setSearch] = useState("");
  const roleItems = useMemo(() => {
    const extra = positions
      .map((item) => item.name.trim())
      .filter((name) => name && !PRESET_ROLES.includes(name));
    const uniqueExtra = [...new Set(extra)];
    const keyword = search.trim().toLowerCase();
    return [...PRESET_ROLES, ...uniqueExtra].filter((name) =>
      name.toLowerCase().includes(keyword),
    );
  }, [positions, search]);
  const filteredPersons = useMemo(
    () =>
      persons.filter((item) =>
        `${item.displayName} ${item.positionName || ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [persons, search],
  );

  return (
    <aside className="ui-layer z-10 flex h-full w-80 flex-col rounded-none border-y-0 border-l-0">
      <div className="border-b border-primary/10 p-4">
        <p className="ui-layer-title mb-1">
          <span className="ui-step">1</span>
          เลือกตำแหน่ง
        </p>
        <p className="mb-3 text-sm text-muted-foreground">ลากรายการไปวางบนแผนผังด้านขวา</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="ค้นหาตำแหน่งหรือชื่อคน" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>
      <Tabs defaultValue="positions" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="positions">ตำแหน่งงาน</TabsTrigger>
          <TabsTrigger value="persons">ผู้รับผิดชอบ</TabsTrigger>
        </TabsList>
        <TabsContent value="positions" className="min-h-0 flex-1 overflow-auto p-4">
          <div className="space-y-2.5">
            {roleItems.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "application/x-workflow-position",
                    JSON.stringify({ title: name, blockType: "position" }),
                  );
                  event.dataTransfer.effectAllowed = "copy";
                }}
                className="cursor-grab rounded-2xl border border-primary/10 bg-sts-soft px-4 py-3.5 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <p className="text-base font-medium">{name}</p>
                </div>
              </div>
            ))}
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  "application/x-workflow-position",
                  JSON.stringify({ title: "งานใหม่", blockType: "work" }),
                );
              }}
              className="cursor-grab rounded-2xl border border-dashed border-primary/30 px-4 py-3.5 text-base text-muted-foreground"
            >
              ลากเพื่อสร้างงานใหม่
            </div>
          </div>
        </TabsContent>
        <TabsContent value="persons" className="min-h-0 flex-1 overflow-auto p-4">
          <p className="mb-3 text-sm text-muted-foreground">ลากชื่อคนไปวางบนกล่องตำแหน่ง</p>
          <div className="space-y-2.5">
            {filteredPersons.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-workflow-person", JSON.stringify(item));
                  event.dataTransfer.effectAllowed = "copy";
                }}
                className="cursor-grab rounded-2xl border border-primary/10 bg-white px-4 py-3.5 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-base font-medium">{item.displayName}</p>
                    <p className="text-sm text-muted-foreground">{item.positionName || "ไม่ระบุตำแหน่ง"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
