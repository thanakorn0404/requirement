import { config } from "dotenv";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { newId, prisma } from "../src/lib/db";

config({ path: ".env.local" });
config();

async function reset() {
  const adminPin = process.env.SEED_ADMIN_PIN;
  const authSecret = process.env.AUTH_SECRET;
  if (!process.env.DATABASE_URL) throw new Error("กรุณากำหนด DATABASE_URL");
  if (!authSecret) throw new Error("กรุณากำหนด AUTH_SECRET");
  if (!adminPin || !/^\d{6}$/.test(adminPin)) {
    throw new Error("กรุณากำหนด SEED_ADMIN_PIN เป็นตัวเลข 6 หลัก");
  }

  const pinLookup = (pin: string) =>
    createHash("sha256").update(`${pin}:${authSecret}`).digest("hex");

  const keptOrgs = await prisma.organization.count({
    where: { status: { not: "deleted" }, deletedAt: null },
  });

  await prisma.auditLog.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.workflowVersion.deleteMany({});
  await prisma.workflowEdge.deleteMany({});
  await prisma.workflowBlockResponsible.deleteMany({});
  await prisma.workflowBlock.deleteMany({});
  await prisma.workflow.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.organization.updateMany({
    data: { createdBy: null, updatedBy: null },
  });

  await prisma.user.createMany({
    data: [
      {
        id: newId(),
        name: "ผู้ดูแลระบบ",
        username: "admin",
        email: "admin@example.com",
        passwordHash: await bcrypt.hash(adminPin, 12),
        pinLookup: pinLookup(adminPin),
        role: "ADMIN",
        status: "active",
      },
      {
        id: newId(),
        name: "ผู้แก้ไข",
        username: "editor",
        email: "editor@example.com",
        passwordHash: await bcrypt.hash("234567", 12),
        pinLookup: pinLookup("234567"),
        role: "EDITOR",
        status: "active",
      },
      {
        id: newId(),
        name: "ผู้ดูข้อมูล",
        username: "viewer",
        email: "viewer@example.com",
        passwordHash: await bcrypt.hash("345678", 12),
        pinLookup: pinLookup("345678"),
        role: "VIEWER",
        status: "active",
      },
    ],
  });

  console.log(`ล้างข้อมูลอื่นแล้ว คงหน่วยงานไว้ ${keptOrgs} รายการ`);
  console.log(`Admin: admin / ${adminPin}`);
  console.log("Editor: editor / 234567");
  console.log("Viewer: viewer / 345678");

  await prisma.$disconnect();
}

reset().catch((error) => {
  console.error(error);
  process.exit(1);
});
