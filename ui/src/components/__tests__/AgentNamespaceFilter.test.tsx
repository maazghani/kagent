import { describe, expect, it, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/app/actions/agentNamespaces", () => ({
  __esModule: true,
  listAgentNamespaces: jest.fn(),
}));

import { AgentNamespaceFilter } from "@/components/AgentNamespaceFilter";
import { listAgentNamespaces } from "@/app/actions/agentNamespaces";

describe("AgentNamespaceFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(listAgentNamespaces).mockResolvedValue({
      message: "ok",
      data: [
        { name: "default", status: "Active" },
        { name: "new", status: "Active" },
        { name: "team-a", status: "Active" },
      ],
    });
  });

  it("navigates to a namespace route and omits reserved route segments", async () => {
    const user = userEvent.setup();
    render(<AgentNamespaceFilter />);

    await user.click(await screen.findByRole("combobox", { name: /namespace filter/i }));

    expect(await screen.findByText("team-a")).toBeInTheDocument();
    expect(screen.queryByText("new")).not.toBeInTheDocument();

    await user.click(screen.getByText("team-a"));

    expect(mockPush).toHaveBeenCalledWith("/agents/team-a");
  });

  it("navigates back to all namespaces", async () => {
    const user = userEvent.setup();
    render(<AgentNamespaceFilter namespace="default" />);

    await user.click(await screen.findByRole("combobox", { name: /namespace filter/i }));
    await user.click(await screen.findByText("All namespaces"));

    expect(mockPush).toHaveBeenCalledWith("/agents");
  });

  it("shows the selected namespace in the trigger", async () => {
    render(<AgentNamespaceFilter namespace="default" />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /namespace filter/i })).toHaveTextContent("default");
    });
  });
});
