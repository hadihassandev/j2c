import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildBranchFromActiveTicket } from "@/lib/branch-from-xml";
import { Check, Copy, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function BranchNameBuilder() {
  const [autoBranch, setAutoBranch] = useState("");
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    refresh();
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const b = (await buildBranchFromActiveTicket()) ?? "";
      setAutoBranch(b);
      setBranch(b);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(branch);
    setCopied(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  const dirty = branch !== autoBranch;

  return (
    <div className="flex items-center gap-2">
      <Input
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        className="flex-1"
        placeholder={loading ? "Loading…" : "Branchname"}
      />

      {dirty && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setBranch(autoBranch)}
        >
          <Undo2 className="h-5 w-5" />
        </Button>
      )}

      <Button
        variant="default"
        size="icon"
        onClick={copy}
        title="Copy"
        disabled={!branch}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </Button>
    </div>
  );
}
