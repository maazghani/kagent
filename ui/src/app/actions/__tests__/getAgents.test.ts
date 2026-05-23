/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@/app/actions/utils", () => ({
  fetchApi: jest.fn(),
  createErrorResponse: (error: unknown, fallback: string) => ({
    message: fallback,
    error: error instanceof Error ? error.message : fallback,
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { fetchApi } from "@/app/actions/utils";
import { getAgents } from "@/app/actions/agents";

const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe("getAgents()", () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
  });

  it("returns [] when the API succeeds with missing data", async () => {
    mockedFetchApi.mockResolvedValueOnce({ message: "ok" } as never);

    const result = await getAgents();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual([]);
  });

  it("returns [] when the API succeeds with empty data array", async () => {
    mockedFetchApi.mockResolvedValueOnce({ message: "ok", data: [] } as never);

    const result = await getAgents();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual([]);
  });

  it("requests /agents (unscoped) when no namespace is provided", async () => {
    mockedFetchApi.mockResolvedValueOnce({ message: "ok", data: [] } as never);

    await getAgents();

    expect(mockedFetchApi).toHaveBeenCalledWith("/agents");
  });

  it("requests /agents?namespace=<ns> when a namespace is provided", async () => {
    mockedFetchApi.mockResolvedValueOnce({ message: "ok", data: [] } as never);

    await getAgents({ namespace: "kagent" });

    expect(mockedFetchApi).toHaveBeenCalledWith("/agents?namespace=kagent");
  });
});
