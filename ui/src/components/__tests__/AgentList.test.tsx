/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AgentResponse } from "@/types";

// Router / search params are controlled per-test by mutating these.
let mockSearchParams = new URLSearchParams();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/agents",
  useSearchParams: () => mockSearchParams,
}));

// Mock getAgents server action.
const mockGetAgents = jest.fn();
jest.mock("@/app/actions/agents", () => ({
  getAgents: (...args: unknown[]) => mockGetAgents(...args),
}));

// NamespaceCombobox is exercised in its own tests; render a simple test double here.
jest.mock("@/components/NamespaceCombobox", () => ({
  NamespaceCombobox: ({
    value,
    onValueChange,
    includeAllOption,
  }: {
    value?: string;
    onValueChange: (v: string) => void;
    includeAllOption?: boolean;
  }) => (
    <div>
      <span data-testid="ns-value">{value ?? ""}</span>
      <span data-testid="ns-include-all">{includeAllOption ? "yes" : "no"}</span>
      <button type="button" onClick={() => onValueChange("")}>pick-all</button>
      <button type="button" onClick={() => onValueChange("team-a")}>pick-team-a</button>
    </div>
  ),
}));

import AgentList from "@/components/AgentList";
import { AgentsContext, type AgentsContextType } from "@/components/AgentsProvider";

function makeAgent(name: string, namespace: string): AgentResponse {
  return {
    id: 1,
    agent: {
      metadata: { name, namespace },
      spec: { type: "Declarative", description: "" },
    },
    deploymentReady: true,
    accepted: true,
  } as AgentResponse;
}

function renderWithProvider() {
  const value: AgentsContextType = {
    models: [],
    loading: false,
    error: "",
    tools: [],
    refreshAgents: jest.fn(async () => {}),
    refreshModels: jest.fn(async () => {}),
    refreshTools: jest.fn(async () => {}),
    createNewAgent: jest.fn(async () => ({ message: "ok" })) as never,
    updateAgent: jest.fn(async () => ({ message: "ok" })) as never,
    getAgent: jest.fn(async () => null) as never,
    validateAgentData: () => ({}),
  } as unknown as AgentsContextType;
  return render(
    <AgentsContext.Provider value={value}>
      <AgentList />
    </AgentsContext.Provider>,
  );
}

describe("AgentList namespace filtering", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockReplace.mockReset();
    mockPush.mockReset();
    mockGetAgents.mockReset();
  });

  it("fetches unscoped agents and renders the all-namespaces banner when no ?namespace is present", async () => {
    mockGetAgents.mockResolvedValueOnce({
      message: "ok",
      data: [makeAgent("support", "kagent"), makeAgent("analyzer", "team-a")],
    });

    renderWithProvider();

    await waitFor(() => expect(mockGetAgents).toHaveBeenCalledTimes(1));
    expect(mockGetAgents).toHaveBeenCalledWith({ namespace: undefined });

    expect(
      await screen.findByText(/Showing agents across all namespaces/i),
    ).toBeInTheDocument();
  });

  it("fetches scoped agents and renders the scoped banner when ?namespace=kagent is present", async () => {
    mockSearchParams = new URLSearchParams("namespace=kagent");
    mockGetAgents.mockResolvedValueOnce({
      message: "ok",
      data: [makeAgent("support", "kagent")],
    });

    renderWithProvider();

    await waitFor(() => expect(mockGetAgents).toHaveBeenCalledTimes(1));
    expect(mockGetAgents).toHaveBeenCalledWith({ namespace: "kagent" });

    expect(await screen.findByText(/namespace/i)).toBeInTheDocument();
    expect(screen.getByText(/kagent/)).toBeInTheDocument();
  });

  it("renders the scoped empty state with a scoped New Agent link when no agents are returned", async () => {
    mockSearchParams = new URLSearchParams("namespace=kagent");
    mockGetAgents.mockResolvedValueOnce({ message: "ok", data: [] });

    renderWithProvider();

    expect(
      await screen.findByText(/No agents found in namespace/i),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /New Agent/i });
    expect(link).toHaveAttribute("href", "/agents/new?namespace=kagent");
  });

  it("switching the namespace selector to a value updates the URL to /agents?namespace=team-a", async () => {
    mockGetAgents.mockResolvedValue({ message: "ok", data: [] });
    renderWithProvider();

    await waitFor(() => expect(mockGetAgents).toHaveBeenCalled());

    await userEvent.click(screen.getByText("pick-team-a"));

    expect(mockReplace).toHaveBeenCalledWith("/agents?namespace=team-a");
  });

  it("switching the namespace selector to All clears the namespace query param", async () => {
    mockSearchParams = new URLSearchParams("namespace=kagent");
    mockGetAgents.mockResolvedValue({ message: "ok", data: [] });
    renderWithProvider();

    await waitFor(() => expect(mockGetAgents).toHaveBeenCalled());

    await userEvent.click(screen.getByText("pick-all"));

    expect(mockReplace).toHaveBeenCalledWith("/agents");
  });
});
