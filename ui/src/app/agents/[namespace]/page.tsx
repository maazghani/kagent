import AgentList from "@/components/AgentList";

export default async function NamespaceAgentListPage({
  params,
}: {
  params: Promise<{ namespace: string }>;
}) {
  const { namespace } = await params;
  return <AgentList namespace={namespace} />;
}
