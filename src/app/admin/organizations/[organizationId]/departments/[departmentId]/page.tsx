import { DepartmentWorkspace } from "@/components/department/department-workspace";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ organizationId: string; departmentId: string }>;
}) {
  const { organizationId, departmentId } = await params;
  return <DepartmentWorkspace organizationId={organizationId} departmentId={departmentId} />;
}
