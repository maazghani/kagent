import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/headers", () => ({
  headers: jest.fn(async () => new Headers()),
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("getAgents", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ data: [] }),
    } as Response);
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://backend/api";
  });

  it("calls /agents without a namespace and /agents?namespace=<namespace> when provided", async () => {
    const { getAgents } = await import("./agents");

    await getAgents();
    expect(mockFetch.mock.calls.at(-1)?.[0]).toBe("http://backend/api/agents");

    await getAgents({ namespace: "team a/b" });
    expect(mockFetch.mock.calls.at(-1)?.[0]).toBe("http://backend/api/agents?namespace=team%20a%2Fb");
  });

  it("treats successful responses without data as empty arrays", async () => {
    const { getAgents } = await import("./agents");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ message: "ok" }),
    } as Response);

    await expect(getAgents()).resolves.toEqual({ message: "Successfully fetched agents", data: [] });
  });
});
