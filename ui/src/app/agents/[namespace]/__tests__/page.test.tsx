import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/AgentList", () => ({
  __esModule: true,
  default: ({ namespace }: { namespace?: string }) => (
    <div data-testid="agent-list">{namespace}</div>
  ),
}));

import NamespaceAgentListPage from "../page";

describe("/agents/[namespace]", () => {
  it("passes the route namespace to AgentList", async () => {
    render(await NamespaceAgentListPage({ params: Promise.resolve({ namespace: "default" }) }));

    expect(screen.getByTestId("agent-list")).toHaveTextContent("default");
  });
});
