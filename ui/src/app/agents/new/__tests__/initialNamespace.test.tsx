/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";

let mockSearchParams = new URLSearchParams();
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn(), back: jest.fn() }),
  usePathname: () => "/agents/new",
  useSearchParams: () => mockSearchParams,
}));

// Stub heavy form sections; we only care about the namespace combobox value here.
jest.mock("@/components/create/SystemPromptSection", () => ({
  SystemPromptSection: () => <div data-testid="system-prompt-section" />,
}));
jest.mock("@/components/create/ModelSelectionSection", () => ({
  ModelSelectionSection: () => <div data-testid="model-selection-section" />,
}));
jest.mock("@/components/create/ToolsSection", () => ({
  ToolsSection: () => <div data-testid="tools-section" />,
}));
jest.mock("@/components/create/MemorySection", () => ({
  MemorySection: () => <div data-testid="memory-section" />,
}));
jest.mock("@/components/create/ContextSection", () => ({
  ContextSection: () => <div data-testid="context-section" />,
}));
jest.mock("@/components/agent-form/AgentSkillsFormSection", () => ({
  AgentSkillsFormSection: () => <div data-testid="skills-section" />,
}));
jest.mock("@/components/agent-form/ByoDeploymentFields", () => ({
  ByoDeploymentFields: () => <div data-testid="byo-fields" />,
}));
jest.mock("@/components/agent-form/ServiceAccountNameField", () => ({
  ServiceAccountNameField: () => <div data-testid="sa-field" />,
}));
jest.mock("@/components/agent-form/DeclarativeRuntimeField", () => ({
  DeclarativeRuntimeField: () => <div data-testid="runtime-field" />,
}));

jest.mock("@/components/NamespaceCombobox", () => ({
  NamespaceCombobox: ({ value }: { value?: string }) => (
    <div data-testid="ns-combobox-value">{value ?? ""}</div>
  ),
}));

import AgentPage from "@/app/agents/new/page";
import { AgentsContext, type AgentsContextType } from "@/components/AgentsProvider";

function ctx(): AgentsContextType {
  return {
    agents: [],
    models: [],
    loading: false,
    error: "",
    tools: [],
    agentsRefreshToken: 0,
    refreshAgents: async () => {},
    refreshModels: async () => {},
    refreshTools: async () => {},
    createNewAgent: jest.fn(async () => ({ message: "ok" })) as never,
    updateAgent: jest.fn(async () => ({ message: "ok" })) as never,
    getAgent: jest.fn(async () => null) as never,
    validateAgentData: () => ({}),
  } as unknown as AgentsContextType;
}

describe("Create Agent page initial namespace", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockPush.mockReset();
  });

  it("defaults the namespace to 'default' when no ?namespace= is provided", () => {
    render(
      <AgentsContext.Provider value={ctx()}>
        <AgentPage />
      </AgentsContext.Provider>,
    );
    expect(screen.getByTestId("ns-combobox-value")).toHaveTextContent("default");
  });

  it("initializes the namespace from ?namespace= in create mode", () => {
    mockSearchParams = new URLSearchParams("namespace=team-a");
    render(
      <AgentsContext.Provider value={ctx()}>
        <AgentPage />
      </AgentsContext.Provider>,
    );
    expect(screen.getByTestId("ns-combobox-value")).toHaveTextContent("team-a");
  });
});
