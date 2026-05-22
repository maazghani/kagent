import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";

jest.mock("next/headers", () => ({
  headers: jest.fn(async () => new Headers()),
}));

jest.mock("@/app/actions/agents", () => ({
  getAgents: jest.fn(),
  getAgent: jest.fn(),
  createAgent: jest.fn(),
}));

jest.mock("@/app/actions/tools", () => ({
  getTools: jest.fn(),
}));

jest.mock("@/app/actions/modelConfigs", () => ({
  getModelConfigs: jest.fn(),
}));

jest.mock("@/app/actions/namespaces", () => ({
  listNamespaces: jest.fn(async () => ({ message: "ok", data: [] })),
}));

describe("AgentListPage", () => {
  it("shows namespace-specific empty copy for filtered empty results", async () => {
    const { getAgents } = await import("@/app/actions/agents");
    const { getTools } = await import("@/app/actions/tools");
    const { getModelConfigs } = await import("@/app/actions/modelConfigs");
    const { AgentsProvider } = await import("@/components/AgentsProvider");
    const { default: AgentListPage } = await import("./page");

    const mockGetAgents = getAgents as jest.MockedFunction<typeof getAgents>;
    const mockGetTools = getTools as jest.MockedFunction<typeof getTools>;
    const mockGetModelConfigs = getModelConfigs as jest.MockedFunction<typeof getModelConfigs>;

    mockGetAgents.mockResolvedValue({ message: "ok", data: [] });
    mockGetTools.mockResolvedValue([]);
    mockGetModelConfigs.mockResolvedValue({ message: "ok", data: [] });

    const page = await AgentListPage({ searchParams: { namespace: "team-a" } });

    render(
      <AgentsProvider>
        {page}
      </AgentsProvider>,
    );

    await waitFor(() => expect(mockGetAgents).toHaveBeenCalledWith({ namespace: "team-a" }));
    expect(await screen.findByText("No agents in namespace team-a")).toBeInTheDocument();
  });

  it("treats successful responses without data as empty lists", async () => {
    const { getAgents } = await import("@/app/actions/agents");
    const { getTools } = await import("@/app/actions/tools");
    const { getModelConfigs } = await import("@/app/actions/modelConfigs");
    const { AgentsProvider } = await import("@/components/AgentsProvider");
    const { default: AgentListPage } = await import("./page");

    (getAgents as jest.MockedFunction<typeof getAgents>).mockResolvedValue({ message: "ok" });
    (getTools as jest.MockedFunction<typeof getTools>).mockResolvedValue([]);
    (getModelConfigs as jest.MockedFunction<typeof getModelConfigs>).mockResolvedValue({ message: "ok", data: [] });

    const page = await AgentListPage({ searchParams: {} });

    render(
      <AgentsProvider>
        {page}
      </AgentsProvider>,
    );

    expect(await screen.findByText("No agents yet")).toBeInTheDocument();
    expect(screen.queryByText("Error Encountered")).not.toBeInTheDocument();
  });
});
