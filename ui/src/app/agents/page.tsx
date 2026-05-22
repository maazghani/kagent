import AgentList from "@/components/AgentList";

interface AgentListPageProps {
  searchParams?: Promise<{ namespace?: string }> | { namespace?: string };
}

export default async function AgentListPage({ searchParams }: AgentListPageProps) {
  const params = await searchParams;
  return <AgentList namespace={params?.namespace} />;
}
