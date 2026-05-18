import { describe, expect, it, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import AgentList from "@/components/AgentList";
import { useAgents } from "@/components/AgentsProvider";
import type { AgentsContextType } from "@/components/AgentsProvider";

jest.mock("@/components/AgentsProvider", () => ({
  useAgents: jest.fn(),
}));

jest.mock("@/components/AgentNamespaceFilter", () => ({
  AgentNamespaceFilter: ({ namespace }: { namespace?: string }) => (
    <div data-testid="namespace-filter">{namespace || "all"}</div>
  ),
}), { virtual: true });

jest.mock("@/components/AgentGrid", () => ({
  AgentGrid: () => <div data-testid="agent-grid" />,
}));

jest.mock("@/components/AgentListView", () => ({
  AgentListView: () => <div data-testid="agent-list-view" />,
}));

function context(overrides: Partial<AgentsContextType> = {}): AgentsContextType {
  return {
    agents: [],
    models: [],
    loading: false,
    error: "",
    tools: [],
    refreshAgents: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    refreshModels: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    refreshTools: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    createNewAgent: jest.fn<AgentsContextType["createNewAgent"]>(),
    updateAgent: jest.fn<AgentsContextType["updateAgent"]>(),
    getAgent: jest.fn<AgentsContextType["getAgent"]>(),
    validateAgentData: jest.fn<AgentsContextType["validateAgentData"]>().mockReturnValue({}),
    ...overrides,
  };
}

describe("AgentList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refreshes agents for the selected namespace", async () => {
    const refreshAgents = jest.fn<(opts?: { namespace?: string }) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(useAgents).mockReturnValue(context({ refreshAgents }));

    render(<AgentList namespace="default" />);

    await waitFor(() => expect(refreshAgents).toHaveBeenCalledWith({ namespace: "default" }));
  });

  it("refreshes all agents when no namespace is selected", async () => {
    const refreshAgents = jest.fn<(opts?: { namespace?: string }) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(useAgents).mockReturnValue(context({ refreshAgents }));

    render(<AgentList />);

    await waitFor(() => expect(refreshAgents).toHaveBeenCalledWith({ namespace: undefined }));
  });

  it("uses namespace-specific empty state copy", () => {
    jest.mocked(useAgents).mockReturnValue(context({ agents: [], loading: false }));

    render(<AgentList namespace="team-a" />);

    expect(screen.getByText('No agents found in namespace "team-a".')).toBeInTheDocument();
  });
});
