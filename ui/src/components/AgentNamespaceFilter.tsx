"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { listAgentNamespaces, type AgentNamespaceOption } from "@/app/actions/agentNamespaces";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const RESERVED_AGENT_NAMESPACE_SEGMENTS = new Set(["new", "new-harness"]);

interface AgentNamespaceFilterProps {
  namespace?: string;
}

export function AgentNamespaceFilter({ namespace }: AgentNamespaceFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namespaces, setNamespaces] = useState<AgentNamespaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNamespaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listAgentNamespaces();

        if (cancelled) {
          return;
        }

        if (response.error) {
          setError(response.error || "Failed to load namespaces");
          setNamespaces([]);
          return;
        }

        setNamespaces(response.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load namespaces");
          setNamespaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNamespaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleNamespaces = useMemo(
    () => namespaces.filter((option) => !RESERVED_AGENT_NAMESPACE_SEGMENTS.has(option.name)),
    [namespaces],
  );

  const selectedNamespace = visibleNamespaces.find((option) => option.name === namespace);
  const triggerLabel = namespace || "All namespaces";

  const navigateToNamespace = (nextNamespace?: string) => {
    setOpen(false);
    if (!nextNamespace) {
      router.push("/agents");
      return;
    }
    router.push(`/agents/${encodeURIComponent(nextNamespace)}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label="Namespace filter"
          aria-expanded={open}
          className="h-9 w-full min-w-0 justify-between gap-2 sm:w-[15rem]"
          disabled={loading}
        >
          {loading ? (
            <span className="flex min-w-0 items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              <span className="truncate">Loading namespaces...</span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{triggerLabel}</span>
              {selectedNamespace?.status ? (
                <span className="shrink-0 text-xs text-muted-foreground">({selectedNamespace.status})</span>
              ) : null}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search namespaces..." />
          <CommandList>
            {error ? (
              <div className="p-2 text-sm text-red-500">Error: {error}</div>
            ) : (
              <>
                <CommandEmpty>No namespaces found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="__all_namespaces__" onSelect={() => navigateToNamespace()}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        namespace ? "opacity-0" : "opacity-100",
                      )}
                    />
                    <span>All namespaces</span>
                  </CommandItem>
                  {visibleNamespaces.map((option) => (
                    <CommandItem
                      key={option.name}
                      value={option.name}
                      onSelect={() => navigateToNamespace(option.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          namespace === option.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{option.name}</span>
                        {option.status ? (
                          <span className="text-xs text-muted-foreground">Status: {option.status}</span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
