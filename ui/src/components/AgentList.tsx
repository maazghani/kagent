"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentGrid } from "@/components/AgentGrid";
import { AgentListView } from "@/components/AgentListView";
import { Plus, LayoutGrid, List } from "lucide-react";
import KagentLogo from "@/components/kagent-logo";
import Link from "next/link";
import { ErrorState } from "./ErrorState";
import { Button } from "./ui/button";
import { LoadingState } from "./LoadingState";
import { useAgents } from "./AgentsProvider";
import { NamespaceCombobox } from "@/components/NamespaceCombobox";
import { getAgents } from "@/app/actions/agents";
import type { AgentResponse } from "@/types";
import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const AGENTS_VIEW_KEY = "kagent-agents-view";
type AgentsView = "grid" | "list";

function readStoredView(): AgentsView {
  if (typeof window === "undefined") {
    return "grid";
  }
  const v = window.localStorage.getItem(AGENTS_VIEW_KEY);
  return v === "list" ? "list" : "grid";
}

export default function AgentList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const namespaceParam = searchParams.get("namespace") ?? undefined;
  const namespace = namespaceParam && namespaceParam.trim() ? namespaceParam : undefined;

  const { agentsRefreshToken } = useAgents();

  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<AgentsView>("grid");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setView(readStoredView());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAgents({ namespace })
      .then((res) => {
        if (cancelled) {
          return;
        }
        if (res.error) {
          setError(res.error);
          setAgents([]);
        } else {
          setError("");
          setAgents(res.data ?? []);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load agents");
        setAgents([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [namespace, agentsRefreshToken]);

  const setViewAndPersist = useCallback((next: AgentsView) => {
    setView(next);
    try {
      window.localStorage.setItem(AGENTS_VIEW_KEY, next);
    } catch {
      // ignore private mode / quota
    }
  }, []);

  const onNamespaceChange = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      const url = trimmed ? `/agents?namespace=${encodeURIComponent(trimmed)}` : "/agents";
      router.replace(url);
    },
    [router],
  );

  const newAgentHref = namespace
    ? `/agents/new?namespace=${encodeURIComponent(namespace)}`
    : "/agents/new";

  if (error) {
    return <ErrorState message={error} />;
  }

  if (loading) {
    return <LoadingState />;
  }

  const scopeBanner = namespace ? (
    <p className="text-sm text-muted-foreground">
      Showing agents in namespace <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{namespace}</code>.
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">Showing agents across all namespaces.</p>
  );

  return (
    <AppPageFrame ariaLabelledBy="agents-page-title" mainClassName="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        titleId="agents-page-title"
        title="Agents"
        description={scopeBanner}
        className="mb-6"
        end={
          agents && agents.length > 0 ? (
            <div
              className="flex w-full min-w-0 items-center justify-end gap-1 rounded-lg border border-border/60 bg-muted/20 p-1"
              role="group"
              aria-label="Layout"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-muted-foreground",
                  view === "grid" && "bg-card text-foreground shadow-sm",
                )}
                aria-pressed={view === "grid"}
                aria-label="Show agents as cards"
                onClick={() => setViewAndPersist("grid")}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline" aria-hidden>
                  Cards
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-muted-foreground",
                  view === "list" && "bg-card text-foreground shadow-sm",
                )}
                aria-pressed={view === "list"}
                aria-label="Show agents as a list"
                onClick={() => setViewAndPersist("list")}
              >
                <List className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline" aria-hidden>
                  List
                </span>
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mb-6 flex flex-col gap-2 sm:max-w-xs">
        <label htmlFor="agents-namespace-filter" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Namespace
        </label>
        <NamespaceCombobox
          id="agents-namespace-filter"
          value={namespace ?? ""}
          onValueChange={onNamespaceChange}
          includeAllOption
          allOptionLabel="All namespaces"
        />
      </div>

      {agents?.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/30 py-12 text-center shadow-sm">
          <KagentLogo className="mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-2 text-lg font-medium tracking-tight">
            {namespace ? `No agents found in namespace ${namespace}` : "No agents yet"}
          </h2>
          <p className="mb-6 text-pretty text-sm text-muted-foreground">
            {namespace
              ? "Create one here, or switch namespaces to see agents elsewhere."
              : "Create an agent to run it in your cluster and wire models and tools in one place."}
          </p>
          <Button asChild size="lg" className="min-w-[12rem]">
            <Link href={newAgentHref}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              New Agent
            </Link>
          </Button>
        </div>
      ) : view === "list" ? (
        <AgentListView agentResponse={agents || []} />
      ) : (
        <AgentGrid agentResponse={agents || []} />
      )}
    </AppPageFrame>
  );
}
