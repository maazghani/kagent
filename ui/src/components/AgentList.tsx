"use client";
import { useCallback, useEffect, useState } from "react";
import { AgentGrid } from "@/components/AgentGrid";
import { AgentListView } from "@/components/AgentListView";
import { Plus, LayoutGrid, List } from "lucide-react";
import KagentLogo from "@/components/kagent-logo";
import Link from "next/link";
import { ErrorState } from "./ErrorState";
import { Button } from "./ui/button";
import { LoadingState } from "./LoadingState";
import { useAgents } from "./AgentsProvider";
import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { AgentNamespaceFilter } from "@/components/AgentNamespaceFilter";

const AGENTS_VIEW_KEY = "kagent-agents-view";
type AgentsView = "grid" | "list";

interface AgentListProps {
  namespace?: string;
}

function readStoredView(): AgentsView {
  if (typeof window === "undefined") {
    return "grid";
  }
  const v = window.localStorage.getItem(AGENTS_VIEW_KEY);
  return v === "list" ? "list" : "grid";
}

export default function AgentList({ namespace }: AgentListProps) {
  const { agents, loading, error, refreshAgents } = useAgents();
  const [view, setView] = useState<AgentsView>("grid");

  useEffect(() => {
    if (namespace) {
      void refreshAgents({ namespace });
      return;
    }
    void refreshAgents({ namespace: undefined });
  }, [namespace, refreshAgents]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setView(readStoredView());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setViewAndPersist = useCallback((next: AgentsView) => {
    setView(next);
    try {
      window.localStorage.setItem(AGENTS_VIEW_KEY, next);
    } catch {
      // ignore private mode / quota
    }
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppPageFrame ariaLabelledBy="agents-page-title" mainClassName="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        titleId="agents-page-title"
        title="Agents"
        description={
          namespace ? (
            <>
              Showing agents in namespace <code>{namespace}</code>.
            </>
          ) : (
            "Showing agents across all namespaces."
          )
        }
        className="mb-8"
        end={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <AgentNamespaceFilter namespace={namespace} />
            {agents && agents.length > 0 ? (
              <div
                className="flex w-full min-w-0 items-center justify-end gap-1 rounded-lg border border-border/60 bg-muted/20 p-1 sm:w-auto"
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
            ) : null}
          </div>
        }
      />

      {agents?.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/30 py-12 text-center shadow-sm">
          <KagentLogo className="mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-2 text-lg font-medium tracking-tight">
            {namespace ? `No agents found in namespace "${namespace}".` : "No agents yet"}
          </h2>
          <p className="mb-6 text-pretty text-sm text-muted-foreground">
            {namespace
              ? "Create an agent in this namespace or switch namespaces."
              : "Create an agent to run it in your cluster and wire models and tools in one place."}
          </p>
          <Button asChild size="lg" className="min-w-[12rem]">
            <Link href="/agents/new">
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
