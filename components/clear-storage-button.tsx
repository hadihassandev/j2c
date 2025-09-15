import { clearAll } from "@/lib/storage";
import { Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

export function ClearStorageButton() {
  const [clearing, setClearing] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClear() {
    setClearing(true);
    try {
      await clearAll();
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } finally {
      setClearing(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleClear}
      disabled={clearing}
      className="gap-2"
    >
      {clearing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Clearing…
        </>
      ) : done ? (
        <>
          <Check className="h-4 w-4" />
          Cleared
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Clear storage
        </>
      )}
    </Button>
  );
}
