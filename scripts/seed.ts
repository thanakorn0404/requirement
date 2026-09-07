import { config } from "dotenv";

config({ path: ".env.local" });
config();
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { newId, prisma } from "../src/lib/db";

async function seed() {
  const adminPin = process.env.SEED_ADMIN_PIN;
  const authSecret = process.env.AUTH_SECRET;
  if (!process.env.DATABASE_URL) throw new Error("กรุณากำหนด DATABASE_URL");
  if (!authSecret) throw new Error("กรุณากำหนด AUTH_SECRET");
  if (!adminPin || !/^\d{6}$/.test(adminPin)) {
    throw new Error("กรุณากำหนด SEED_ADMIN_PIN เป็นตัวเลข 6 หลัก สำหรับ Development");
  }

  const pinLookup = (pin: string) =>
    createHash("sha256").update(`${pin}:${authSecret}`).digest("hex");

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
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  const adminId = newId();
  await prisma.user.createMany({
    data: [
      {
        id: adminId,
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

  const organization = await prisma.organization.create({
    data: {
      id: newId(),
      name: "องค์การบริหารส่วนตำบลตัวอย่าง",
      type: "อบต.",
      province: "สุราษฎร์ธานี",
      district: "เมือง",
      subdistrict: "ตัวอย่าง",
      address: "123 หมู่ 1 ตำบลตัวอย่าง",
      phone: "077-000-000",
      email: "info@example.local",
      description: "หน่วยงานตัวอย่างสำหรับพัฒนาระบบสารบรรณ",
      status: "active",
      createdBy: adminId,
      updatedBy: adminId,
    },
  });

  const officeId = newId();
  const financeId = newId();
  const engineeringId = newId();
  await prisma.department.createMany({
    data: [
      {
        id: officeId,
        organizationId: organization.id,
        name: "สำนักปลัด",
        code: "SP",
        type: "สำนัก",
        status: "active",
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        id: financeId,
        organizationId: organization.id,
        name: "กองคลัง",
        code: "FIN",
        type: "กอง",
        status: "active",
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        id: engineeringId,
        organizationId: organization.id,
        name: "กองช่าง",
        code: "ENG",
        type: "กอง",
        status: "active",
        createdBy: adminId,
        updatedBy: adminId,
      },
    ],
  });

  const posClerk = newId();
  const posAcc = newId();
  const posHead = newId();
  const posDir = newId();
  const posChief = newId();
  const posMayor = newId();
  await prisma.position.createMany({
    data: [
      { id: posClerk, departmentId: financeId, name: "เจ้าพนักงานธุรการ", code: "CLERK", level: 1, status: "active" },
      { id: posAcc, departmentId: financeId, name: "นักวิชาการเงินและบัญชี", code: "ACC", level: 2, status: "active" },
      { id: posHead, departmentId: financeId, name: "หัวหน้าฝ่าย", code: "HEAD", level: 3, status: "active" },
      { id: posDir, departmentId: financeId, name: "ผู้อำนวยการกองคลัง", code: "DIR", level: 4, status: "active" },
      { id: posChief, departmentId: financeId, name: "ปลัด", code: "CLERK-CHIEF", level: 5, status: "active" },
      { id: posMayor, departmentId: financeId, name: "นายก", code: "MAYOR", level: 6, status: "active" },
    ],
  });

  const personA = newId();
  const personB = newId();
  const personC = newId();
  const personD = newId();
  const personE = newId();
  const persons = [
    { id: personA, positionId: posClerk, firstName: "A", displayName: "นางสาว A", phone: "081-000-0001", email: "a@example.local" },
    { id: personB, positionId: posHead, firstName: "B", displayName: "นาย B", phone: "081-000-0002", email: "b@example.local" },
    { id: personC, positionId: posDir, firstName: "C", displayName: "นาย C", phone: "081-000-0003", email: "c@example.local" },
    { id: personD, positionId: posChief, firstName: "D", displayName: "นาย D", phone: "081-000-0004", email: "d@example.local" },
    { id: personE, positionId: posMayor, firstName: "E", displayName: "นาย E", phone: "081-000-0005", email: "e@example.local" },
  ];
  await prisma.person.createMany({
    data: persons.map((person) => ({
      id: person.id,
      organizationId: organization.id,
      departmentId: financeId,
      positionId: person.positionId,
      firstName: person.firstName,
      lastName: "ตัวอย่าง",
      displayName: person.displayName,
      phone: person.phone,
      email: person.email,
      status: "active",
    })),
  });

  const workflow = await prisma.workflow.create({
    data: {
      id: newId(),
      organizationId: organization.id,
      departmentId: financeId,
      name: "การเดินหนังสือกองคลัง",
      description: "ขั้นตอนการเดินหนังสือของกองคลัง",
      status: "draft",
      currentVersion: 1,
      createdBy: adminId,
      updatedBy: adminId,
    },
  });

  const blockDefs = [
    { title: "ธุรการกองคลัง", description: "รับหนังสือ ลงทะเบียน และส่งต่อหนังสือ", x: 280, y: 40, personId: personA, responsibility: "รับหนังสือ" },
    { title: "หัวหน้าฝ่าย", description: "ตรวจสอบหนังสือ", x: 280, y: 280, personId: personB, responsibility: "ตรวจสอบ" },
    { title: "ผอ.กองคลัง", description: "พิจารณาและเสนอ", x: 280, y: 520, personId: personC, responsibility: "เสนอ" },
    { title: "ปลัด", description: "เสนอผู้บริหาร", x: 280, y: 760, personId: personD, responsibility: "เสนออนุมัติ" },
    { title: "นายก", description: "พิจารณาอนุมัติ", x: 280, y: 1000, personId: personE, responsibility: "อนุมัติ" },
  ];

  const blocks = [];
  for (const def of blockDefs) {
    const block = await prisma.workflowBlock.create({
      data: {
        id: newId(),
        workflowId: workflow.id,
        title: def.title,
        description: def.description,
        blockType: "work",
        x: def.x,
        y: def.y,
        width: 320,
        height: 200,
        status: "active",
        createdBy: adminId,
        updatedBy: adminId,
      },
    });
    await prisma.workflowBlockResponsible.create({
      data: {
        id: newId(),
        blockId: block.id,
        personId: def.personId,
        responsibility: def.responsibility,
      },
    });
    blocks.push(block);
  }

  const edgeLabels = ["รับเรื่อง", "ตรวจสอบ", "เสนอ", "เสนออนุมัติ"];
  const edges = [];
  for (let index = 0; index < blocks.length - 1; index += 1) {
    const edge = await prisma.workflowEdge.create({
      data: {
        id: newId(),
        workflowId: workflow.id,
        sourceBlockId: blocks[index].id,
        targetBlockId: blocks[index + 1].id,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: "smoothstep",
        label: edgeLabels[index],
        animated: false,
      },
    });
    edges.push(edge);
  }

  const positionNames: Record<string, string> = {
    [posClerk]: "เจ้าพนักงานธุรการ",
    [posHead]: "หัวหน้าฝ่าย",
    [posDir]: "ผู้อำนวยการกองคลัง",
    [posChief]: "ปลัด",
    [posMayor]: "นายก",
  };

  await prisma.workflowVersion.create({
    data: {
      id: newId(),
      workflowId: workflow.id,
      version: 1,
      name: "Version 1",
      note: "ข้อมูลเริ่มต้นจาก Seed",
      createdBy: adminId,
      blocks: blocks.map((block, index) => ({
        id: block.id,
        title: block.title,
        description: block.description,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        blockType: block.blockType,
        responsiblePersons: [
          {
            personId: persons[index].id,
            personNameSnapshot: persons[index].displayName,
            positionId: persons[index].positionId,
            positionNameSnapshot: positionNames[persons[index].positionId] || "",
            responsibilitySnapshot: blockDefs[index].responsibility,
          },
        ],
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sourceBlockId: edge.sourceBlockId,
        targetBlockId: edge.targetBlockId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        label: edge.label,
      })),
    },
  });

  await prisma.requirement.createMany({
    data: [
      {
        id: newId(),
        organizationId: organization.id,
        departmentId: financeId,
        workflowId: workflow.id,
        blockId: blocks[0].id,
        responsiblePersonId: personA,
        positionId: posClerk,
        requirementCode: "REQ-001",
        title: "รับหนังสือ",
        category: "workflow",
        description: "รับหนังสือเข้าและตรวจสอบความครบถ้วน",
        input: "หนังสือเข้า",
        process: "ตรวจเอกสารและลงรับ",
        output: "หนังสือที่ลงรับแล้ว",
        priority: "high",
        status: "draft",
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        id: newId(),
        organizationId: organization.id,
        departmentId: financeId,
        workflowId: workflow.id,
        blockId: blocks[0].id,
        responsiblePersonId: personA,
        positionId: posClerk,
        requirementCode: "REQ-002",
        title: "ลงทะเบียนหนังสือ",
        category: "workflow",
        description: "บันทึกทะเบียนหนังสือ",
        input: "หนังสือที่ลงรับ",
        process: "บันทึกเลขทะเบียน",
        output: "ทะเบียนหนังสือ",
        priority: "medium",
        status: "draft",
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        id: newId(),
        organizationId: organization.id,
        departmentId: financeId,
        workflowId: workflow.id,
        blockId: blocks[1].id,
        responsiblePersonId: personB,
        positionId: posHead,
        requirementCode: "REQ-003",
        title: "เสนอหัวหน้า",
        category: "workflow",
        description: "ส่งต่อหนังสือให้หัวหน้าฝ่ายตรวจสอบ",
        input: "หนังสือที่ลงทะเบียน",
        process: "เสนอหัวหน้าฝ่าย",
        output: "หนังสือรอตรวจสอบ",
        priority: "medium",
        status: "draft",
        createdBy: adminId,
        updatedBy: adminId,
      },
    ],
  });

  console.log("Seed completed");
  console.log(`Admin: admin / ${adminPin}`);
  console.log("Editor: editor / 234567");
  console.log("Viewer: viewer / 345678");
  console.log(`หน่วยงาน: ${organization.name}`);
  console.log("กอง: สำนักปลัด, กองคลัง, กองช่าง");
  console.log(`Workflow: ${workflow.name}`);

  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
