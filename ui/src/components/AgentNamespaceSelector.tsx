"use client";

import { listNamespaces, type NamespaceResponse } from "@/app/actions/namespaces";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AgentNamespaceSelectorProps {
  selectedNamespace?: string;
}

export default function AgentNamespaceSelector({ selectedNamespace }: AgentNamespaceSelectorProps) {
  const router = useRouter();
  const [namespaces, setNamespaces] = useState<NamespaceResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    listNamespaces().then((response) => {
      if (!cancelled) {
        setNamespaces([...(response.data || [])].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <label className="flex w-64 flex-col gap-1 text-sm">
      <span className="text-muted-foreground">Namespace</span>
      <select
        className="rounded-md border border-input bg-background px-3 py-2"
        value={selectedNamespace || ""}
        onChange={(event) => {
          const namespace = event.target.value;
          router.push(namespace ? `/agents?namespace=${encodeURIComponent(namespace)}` : "/agents");
        }}
      >
        <option value="">All namespaces</option>
        {namespaces.map((namespace) => (
          <option key={namespace.name} value={namespace.name}>
            {namespace.name}
          </option>
        ))}
      </select>
    </label>
  );
}
