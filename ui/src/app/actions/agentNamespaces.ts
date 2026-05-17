"use server";

import { listNamespaces } from "@/app/actions/namespaces";
import type { BaseResponse } from "@/types";

export type AgentNamespaceOption = {
  name: string;
  status?: string;
};

export async function listAgentNamespaces(): Promise<BaseResponse<AgentNamespaceOption[]>> {
  const response = await listNamespaces();

  if (response.error) {
    return {
      message: response.message,
      error: response.error,
      data: [],
    };
  }

  const data = [...(response.data || [])]
    .map((namespace) => ({
      name: namespace.name,
      status: namespace.status,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return {
    message: response.message || "Agent namespaces fetched successfully",
    data,
  };
}
