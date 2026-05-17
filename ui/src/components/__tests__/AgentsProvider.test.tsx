import { describe, expect, it, beforeEach } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { AgentsProvider, type AgentsContextType, useAgents } from "@/components/AgentsProvider";
import { getAgents } from "@/app/actions/agents";
import { getTools } from "@/app/actions/tools";
import { getModelConfigs } from "@/app/actions/modelConfigs";

jest.mock("@/app/actions/agents", () => ({
  __esModule: true,
  createAgent: jest.fn(),
  getAgent: jest.fn(),
  getAgents: jest.fn(),
}));

jest.mock("@/app/actions/tools", () => ({
  __esModule: true,
  getTools: jest.fn(),
}));

jest.mock("@/app/actions/modelConfigs", () => ({
  __esModule: true,
  getModelConfigs: jest.fn(),
}));

function ContextProbe({ onContext }: { onContext: (context: AgentsContextType) => void }) {
  const context = useAgents();
  useEffect(() => {
    onContext(context);
  }, [context, onContext]);
  return null;
}

describe("AgentsProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAgents).mockResolvedValue({ message: "ok", data: [] });
    jest.mocked(getTools).mockResolvedValue([]);
    jest.mocked(getModelConfigs).mockResolvedValue({ message: "ok", data: [] });
  });

  it("passes the selected namespace through scoped agent refreshes", async () => {
    let context: AgentsContextType | undefined;

    render(
      <AgentsProvider>
        <ContextProbe onContext={(next) => { context = next; }} />
      </AgentsProvider>,
    );

    await waitFor(() => expect(context).toBeDefined());
    jest.mocked(getAgents).mockClear();

    await act(async () => {
      await (context!.refreshAgents as (opts?: { namespace?: string }) => Promise<void>)({ namespace: "default" });
    });

    expect(getAgents).toHaveBeenCalledTimes(1);
    expect(getAgents).toHaveBeenCalledWith({ namespace: "default" });
  });

  it("does not fetch all agents on provider mount", async () => {
    let context: AgentsContextType | undefined;

    render(
      <AgentsProvider>
        <ContextProbe onContext={(next) => { context = next; }} />
      </AgentsProvider>,
    );

    await waitFor(() => expect(context).toBeDefined());

    expect(getAgents).not.toHaveBeenCalled();
  });

  it("keeps all-agent refreshes unscoped", async () => {
    let context: AgentsContextType | undefined;

    render(
      <AgentsProvider>
        <ContextProbe onContext={(next) => { context = next; }} />
      </AgentsProvider>,
    );

    await waitFor(() => expect(context).toBeDefined());
    jest.mocked(getAgents).mockClear();

    await act(async () => {
      await context!.refreshAgents();
    });

    expect(getAgents).toHaveBeenCalledTimes(1);
    expect(getAgents).toHaveBeenCalledWith();
  });

  it("treats successful scoped agent list responses without data as empty lists", async () => {
    let context: AgentsContextType | undefined;

    jest.mocked(getAgents).mockResolvedValue({ message: "ok" });

    render(
      <AgentsProvider>
        <ContextProbe onContext={(next) => { context = next; }} />
      </AgentsProvider>,
    );

    await waitFor(() => expect(context).toBeDefined());

    await act(async () => {
      await context!.refreshAgents({ namespace: "default" });
    });

    await waitFor(() => {
      expect(context!.agents).toEqual([]);
      expect(context!.error).toBe("");
    });
    expect(getAgents).toHaveBeenCalledWith({ namespace: "default" });
  });
});
