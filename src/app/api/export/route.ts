import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toCsv } from "@/lib/utils";
import { listOrganizations } from "@/services/organization.service";
import { listRequirements } from "@/services/requirement.service";
import { listWorkflows } from "@/services/workflow.service";
import { listPersons } from "@/services/person.service";
import { listPositions } from "@/services/position.service";
import { listDepartments } from "@/services/department.service";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "organizations";
    const format = searchParams.get("format") || "csv";
    const departmentId = searchParams.get("departmentId") || "";
    const organizationId = searchParams.get("organizationId") || "";

    let headers: string[] = [];
    let rows: unknown[][] = [];
    let filename = "export.csv";

    if (type === "organizations") {
      const data = await listOrganizations({
        page: 1,
        pageSize: 1000,
        search: "",
        sortBy: "name",
        sortOrder: 1,
      });
      headers = ["ชื่อหน่วยงาน", "ประเภท", "จังหวัด", "อำเภอ", "ตำบล", "สถานะ"];
      rows = data.items.map((item) => [
        item.name,
        item.type,
        item.province,
        item.district,
        item.subdistrict,
        item.status,
      ]);
      filename = "organizations.csv";
    } else if (type === "departments" && organizationId) {
      const items = await listDepartments(organizationId);
      headers = ["ชื่อกอง/สำนัก", "รหัส", "ประเภท", "สถานะ"];
      rows = items.map((item) => [item.name, item.code, item.type, item.status]);
      filename = "departments.csv";
    } else if (type === "positions" && departmentId) {
      const items = await listPositions(departmentId);
      headers = ["ตำแหน่ง", "รหัส", "ระดับ", "สถานะ"];
      rows = items.map((item) => [item.name, item.code, item.level, item.status]);
      filename = "positions.csv";
    } else if (type === "persons" && departmentId) {
      const items = await listPersons(departmentId);
      headers = ["ชื่อแสดงผล", "ชื่อ", "นามสกุล", "ตำแหน่ง", "เบอร์โทร", "อีเมล", "สถานะ"];
      rows = items.map((item) => [
        item.displayName,
        item.firstName,
        item.lastName,
        item.positionName || "",
        item.phone,
        item.email,
        item.status,
      ]);
      filename = "persons.csv";
    } else if (type === "workflows") {
      const items = await listWorkflows(departmentId || undefined);
      headers = ["ชื่อการเดินหนังสือ", "สถานะ", "เวอร์ชันปัจจุบัน"];
      rows = items.map((item) => [item.name, item.status, item.currentVersion]);
      filename = "workflows.csv";
    } else if (type === "requirements") {
      const data = await listRequirements({
        departmentId: departmentId || undefined,
        organizationId: organizationId || undefined,
        page: 1,
        pageSize: 1000,
      });
      headers = ["รหัส", "ชื่อ", "หมวดหมู่", "ความสำคัญ", "สถานะ", "งาน/ตำแหน่ง"];
      rows = data.items.map((item) => [
        item.requirementCode,
        item.title,
        item.category,
        item.priority,
        item.status,
        item.blockTitle || "",
      ]);
      filename = "requirements.csv";
    }

    if (format !== "csv") {
      return NextResponse.json(
        { success: false, message: "รูปแบบนี้ยังไม่รองรับในเวอร์ชันนี้", errorCode: "EXPORT_FORMAT" },
        { status: 400 },
      );
    }

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
