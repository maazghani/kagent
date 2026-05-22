import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/app/actions/namespaces", () => ({
  listNamespaces: jest.fn(),
}));

describe("AgentNamespaceSelector", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("navigates to /agents?namespace=<namespace> when a namespace is selected", async () => {
    const { listNamespaces } = await import("@/app/actions/namespaces");
    const { default: AgentNamespaceSelector } = await import("./AgentNamespaceSelector");
    const mockListNamespaces = listNamespaces as jest.MockedFunction<typeof listNamespaces>;

    mockListNamespaces.mockResolvedValue({
      message: "ok",
      data: [{ name: "team a/b", status: "Active" }],
    });

    render(<AgentNamespaceSelector selectedNamespace={undefined} />);

    await screen.findByText("team a/b");
    fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "team a/b" } });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/agents?namespace=team%20a%2Fb"));
  });

  it("navigates back to /agents when All namespaces is selected", async () => {
    const { listNamespaces } = await import("@/app/actions/namespaces");
    const { default: AgentNamespaceSelector } = await import("./AgentNamespaceSelector");
    const mockListNamespaces = listNamespaces as jest.MockedFunction<typeof listNamespaces>;

    mockListNamespaces.mockResolvedValue({
      message: "ok",
      data: [{ name: "team-a", status: "Active" }],
    });

    render(<AgentNamespaceSelector selectedNamespace="team-a" />);

    fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "" } });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/agents"));
  });
});
