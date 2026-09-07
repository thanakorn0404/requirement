import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";

export default async function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ organizationId: string; departmentId: string; workflowId: string }>;
}) {
  const { organizationId, departmentId, workflowId } = await params;
  return (
    <WorkflowBuilder
      organizationId={organizationId}
      departmentId={departmentId}
      workflowId={workflowId}
    />
  );
}
