import { WorkflowPublicViewer } from "@/components/workflow/workflow-public-viewer";

export default async function PublicWorkflowSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <WorkflowPublicViewer token={token} />;
}
