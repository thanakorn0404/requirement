import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { createInterface } from "readline";
import { config } from "dotenv";
import { newId, prisma } from "../src/lib/db";
import type { OrganizationType } from "../src/types";

config({ path: ".env.local" });
config();

const SOURCE_URL =
  "https://opendata.dla.go.th/dataset/1a668c66-c6d6-4c94-bc0f-e57c81813eb8/resource/604803c1-2975-4a66-8549-59d6ce16ca9e/download/untitled.csv";
const LOCAL_CSV = path.join(process.cwd(), "data", "local-gov-2569.csv");

const TYPE_MAP: Record<string, OrganizationType> = {
  องค์การบริหารส่วนตำบล: "อบต.",
  เทศบาลตำบล: "เทศบาลตำบล",
  เทศบาลเมือง: "เทศบาลเมือง",
  เทศบาลนคร: "เทศบาลนคร",
};

const TYPE_PREFIX: Record<OrganizationType, string> = {
  "อบต.": "องค์การบริหารส่วนตำบล",
  เทศบาลตำบล: "เทศบาลตำบล",
  เทศบาลเมือง: "เทศบาลเมือง",
  เทศบาลนคร: "เทศบาลนคร",
  อื่นๆ: "",
};

function parseCsvLine(line: string) {
  const cols = line.replace(/^\uFEFF/, "").split(",");
  return {
    province: (cols[1] || "").trim(),
    district: (cols[2] || "").trim(),
    rawType: (cols[3] || "").trim(),
    shortName: (cols[4] || "").trim(),
  };
}

function toOfficialName(type: OrganizationType, shortName: string) {
  const prefix = TYPE_PREFIX[type];
  if (!prefix) return shortName;
  if (shortName.startsWith(prefix) || shortName.startsWith(type)) return shortName;
  return `${prefix}${shortName}`;
}

async function ensureCsv() {
  try {
    const info = await stat(LOCAL_CSV);
    if (info.size > 1000) return LOCAL_CSV;
  } catch {
    // ยังไม่มีไฟล์ จะดาวน์โหลดจาก DLA
  }

  await mkdir(path.dirname(LOCAL_CSV), { recursive: true });
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`ดาวน์โหลดรายชื่อ อปท. ไม่สำเร็จ (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(LOCAL_CSV, buffer);
  return LOCAL_CSV;
}

async function readRows(filePath: string) {
  const rows: Array<{
    name: string;
    type: OrganizationType;
    province: string;
    district: string;
  }> = [];
  const seen = new Set<string>();
  const reader = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let header = true;
  for await (const line of reader) {
    if (header) {
      header = false;
      continue;
    }
    if (!line.trim()) continue;
    const parsed = parseCsvLine(line);
    const type = TYPE_MAP[parsed.rawType];
    if (!type || !parsed.shortName || !parsed.province) continue;
    const name = toOfficialName(type, parsed.shortName);
    const key = `${type}|${parsed.province}|${parsed.district}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      name,
      type,
      province: parsed.province,
      district: parsed.district,
    });
  }
  return rows;
}

async function importOrganizations() {
  if (!process.env.DATABASE_URL) throw new Error("กรุณากำหนด DATABASE_URL");

  const filePath = await ensureCsv();
  const rows = await readRows(filePath);
  if (!rows.length) throw new Error("ไม่พบรายชื่อ อบต. / เทศบาล ที่จะนำเข้า");

  const existing = await prisma.organization.findMany({
    where: { status: { not: "deleted" }, deletedAt: null },
    select: { name: true, type: true, province: true, district: true },
  });
  const existingKeys = new Set(
    existing.map((item) => `${item.type}|${item.province}|${item.district || ""}|${item.name}`),
  );

  const toInsert = rows
    .filter((row) => !existingKeys.has(`${row.type}|${row.province}|${row.district}|${row.name}`))
    .map((row) => ({
      id: newId(),
      ...row,
      subdistrict: "",
      address: "",
      phone: "",
      email: "",
      description: "นำเข้าจากกรมส่งเสริมการปกครองท้องถิ่น ข้อมูล ณ วันที่ 10 มิถุนายน 2569",
      logoUrl: "",
      status: "active",
    }));

  const batchSize = 500;
  let inserted = 0;
  for (let index = 0; index < toInsert.length; index += batchSize) {
    const batch = toInsert.slice(index, index + batchSize);
    const result = await prisma.organization.createMany({ data: batch });
    inserted += result.count;
  }

  const counts = await prisma.organization.groupBy({
    by: ["type"],
    where: { status: { not: "deleted" }, deletedAt: null },
    _count: { _all: true },
    orderBy: { type: "asc" },
  });

  console.log(`นำเข้าใหม่ ${inserted} หน่วยงาน จากไฟล์ ${rows.length} รายการ`);
  console.log(`ข้ามของที่มีอยู่แล้ว ${rows.length - toInsert.length} รายการ`);
  for (const row of counts) {
    console.log(`${row.type}: ${row._count._all}`);
  }

  await prisma.$disconnect();
}

importOrganizations().catch((error) => {
  console.error(error);
  process.exit(1);
});
