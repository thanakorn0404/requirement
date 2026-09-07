# ระบบจัดเก็บ Requirement สารบรรณ

Web Application สำหรับจัดเก็บกระบวนการทำงานของหน่วยงานท้องถิ่น ออกแบบการเดินหนังสือ และผูก Requirement กับงาน / ตำแหน่ง / หน้าที่

## สิ่งที่ระบบแยกชัดเจน

- **Block** = งาน / ตำแหน่ง / หน้าที่ เช่น `ธุรการกองคลัง`
- **Person** = บุคลากรผู้รับผิดชอบ เช่น `นางสาว A`
- 1 Block มีได้หลาย Person และ 1 Person รับผิดชอบได้หลาย Block
- ลูกศรเชื่อม **Block → Block** เท่านั้น ไม่เชื่อมบุคคล
- ไม่เก็บและไม่แสดงรูปภาพบุคลากร

## สิทธิ์ผู้ใช้

- `ADMIN` จัดการทั้งหมด รวมผู้ใช้ Audit Log และ Restore Version
- `EDITOR` เพิ่ม/แก้ไข กอง ตำแหน่ง บุคลากร การเดินหนังสือ และ Requirement
- `VIEWER` ดูข้อมูลอย่างเดียว

## วิธีติดตั้ง

```bash
npm install
```

คัดลอกไฟล์สภาพแวดล้อม:

```bash
copy .env.example .env.local
```

กำหนดค่าอย่างน้อย:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/saraban-requirement
AUTH_SECRET=เปลี่ยนเป็นความลับอย่างน้อย-32-ตัวอักษร
NEXT_PUBLIC_APP_URL=http://localhost:3000
SEED_ADMIN_PIN=123456
```

ห้ามใส่ Secret จริงใน Git และห้าม Hardcode PIN Production

## วิธี Seed ข้อมูลพัฒนา

ต้องมี MongoDB ท้องถิ่นหรือ MongoDB Atlas ก่อน

```bash
npm run seed
```

บัญชีทดสอบ Development เข้าด้วย PIN 6 หลัก (ไม่ต้องใส่ username):

- ผู้ดูแลระบบ: PIN จาก `SEED_ADMIN_PIN` (ค่าเริ่มต้น `123456`)
- ผู้แก้ไข: `234567`
- ผู้ดูข้อมูล: `345678`

## วิธี Run

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) แล้วเข้า `/login`

- ADMIN ไปที่ `/admin`
- EDITOR / VIEWER ไปที่ `/dashboard`

## วิธี Build

```bash
npm run build
npm start
```

## วิธี Deploy

1. สร้างโปรเจกต์บน Vercel
2. ตั้ง Environment Variables: `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
3. ใช้ MongoDB Atlas เป็นฐานข้อมูล
4. Deploy จาก Git หรือ `vercel`
5. รัน Seed เฉพาะสภาพแวดล้อมพัฒนา ไม่ควร Seed ทับข้อมูลจริง

## Architecture โดยย่อ

- Frontend: Next.js 15 App Router, React, TypeScript, Tailwind, shadcn-style UI
- Workflow Builder: `@xyflow/react` + Zustand
- Backend: Route Handlers, Zod, JWT HttpOnly Cookie
- Database: MongoDB + Mongoose
- Collection หลัก: User, Organization, Department, Position, Person, Workflow, WorkflowBlock, WorkflowBlockResponsible, WorkflowEdge, WorkflowVersion, Requirement, AuditLog

Current Workflow ใช้ข้อมูลล่าสุดใน Collection  
Version ที่บันทึกแล้วเป็น Snapshot ที่แก้ไขไม่ได้ หาก Restore จะสร้าง Version ใหม่

## สิ่งที่ทำเสร็จ

- Login / Logout / Session / Role
- CRUD หน่วยงาน กอง ตำแหน่ง บุคลากร การเดินหนังสือ Requirement
- Workflow Builder: สร้าง/ลาก/ย้าย/ย่อขยาย Block, เพิ่ม-ลบผู้รับผิดชอบ, เชื่อมลูกศร, Undo/Redo, Auto Save ร่าง, Save Version, Restore
- Audit Log, Export CSV, หน้าพิมพ์ Workflow จาก Structured Data
- Seed ข้อมูลตัวอย่างกองคลัง

## สิ่งที่ยัง TODO

- Export Excel / PDF แบบไฟล์สำเร็จรูป (ตอนนี้รองรับ CSV และการพิมพ์จาก Structured Data)
- Auto Layout อัตโนมัติแบบเต็มรูปแบบ (เตรียม Architecture แล้ว ใช้จัดตำแหน่งด้วยมือเป็นหลัก)
- Document Node สำหรับหนังสือเข้า-ออก (เตรียมประเภทโหนดแล้ว ยังไม่เปิดใช้ในเวอร์ชันแรก)
