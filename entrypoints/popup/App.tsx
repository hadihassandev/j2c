import logoUrl from "@/assets/logo.svg";
import BranchNameBuilder from "@/components/branchname-builder";
import { ClearStorageButton } from "@/components/clear-storage-button";
import { PrefixInput } from "@/components/prefix-input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { defaultConfigs, defaultTypePrefixes } from "@/lib/defaults";
import { settingsKeys } from "@/lib/storage-keys";
import {
  useStorageBool,
  useStorageNumber,
  useStorageString,
} from "@/lib/use-storage";
import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";

const prefixTypes = [
  {
    name: "Story",
    color: "bg-emerald-500",
  },
  {
    name: "Sub-Task",
    color: "bg-blue-500",
  },
  {
    name: "Bug",
    color: "bg-red-500",
  },
];

const DEFAULT_TAB = "branches";

function App() {
  const [currentTab, setCurrentTab] = useState<string>(DEFAULT_TAB);

  const patternInputRef = useRef<HTMLInputElement>(null);

  const [branch, setBranch] = useState("");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(branch);
    } catch {}
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  const {
    value: pattern,
    setValue: setPattern,
    ready: patternReady,
  } = useStorageString("pattern", defaultTypePrefixes.pattern);

  const umlauts = useStorageBool(
    "config_convertUmlaute",
    defaultConfigs.convertUmlaute
  );
  const special = useStorageBool(
    "config_convertSpecialCharacters",
    defaultConfigs.convertSpecialCharacters
  );
  const spaces = useStorageBool(
    "config_convertWhitespaces",
    defaultConfigs.convertWhitespaces
  );
  const lower = useStorageBool(
    "config_makeLowerCase",
    defaultConfigs.makeLowerCase
  );
  const maxLen = useStorageNumber(
    "config_maxBranchnameLength",
    defaultConfigs.maxBranchnameLength
  );
  const replWS = useStorageString(
    "config_whitespaceReplacementChar",
    defaultConfigs.whitespaceReplacementChar
  );
  const replSpec = useStorageString(
    "config_specialCharactersReplacementChar",
    defaultConfigs.specialCharactersReplacementChar
  );

  const jiraBase = useStorageString(settingsKeys.jiraBaseUrl, "");
  const normalizeBase = (s: string) => {
    const t = s.trim();
    if (!t) return "";
    try {
      const u = new URL(t.includes("://") ? t : `https://${t}`);
      return `${u.protocol}//${u.host}`;
    } catch {
      return t;
    }
  };

  return (
    <div className="max-w-[500px] min-w-[500px] flex flex-col gap-0 overflow-hidden">
      <header className="h-14 border-b px-3 flex items-center justify-between bg-primary fixed w-full">
        <div className="flex items-center h-9 w-9 p-2">
          <img src={logoUrl} alt="Logo" />
        </div>
        <span className="text-white text-lg font-semibold">J2C</span>
        <Button
          variant="link"
          size="icon"
          aria-label="Settings"
          className="group cursor-pointer"
          onClick={() => setCurrentTab("settings")}
        >
          <Wrench
            color="white"
            className={cn(
              currentTab === "settings"
                ? "fill-white"
                : "group-hover:scale-105 group-hover:fill-white"
            )}
          />
          <span className="sr-only">Settings</span>
        </Button>
      </header>
      <main>
        <Tabs
          defaultValue={DEFAULT_TAB}
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="fixed mt-14">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
          </TabsList>
          <div className="mt-[96px]">
            <TabsContent value="branches" className="p-4 pt-3.5">
              <BranchNameBuilder />
            </TabsContent>
            <TabsContent value="configurations">
              <ScrollArea className="h-[455px]">
                <div className="flex flex-col gap-5 pt-2.5 pb-3">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Separator className="min-w-4 flex-0" />
                      <span className="text-muted-foreground text-xs">
                        Prefixes
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 px-4">
                      <PrefixInput
                        label="Story"
                        colorDotClass="bg-emerald-500"
                        storageKey="prefix_story"
                        defaultValue={defaultTypePrefixes.story}
                      />
                      <PrefixInput
                        label="Sub-Task"
                        colorDotClass="bg-blue-500"
                        storageKey="prefix_subtask"
                        defaultValue={defaultTypePrefixes.subtask}
                      />
                      <PrefixInput
                        label="Bug"
                        colorDotClass="bg-red-500"
                        storageKey="prefix_bug"
                        defaultValue={defaultTypePrefixes.bug}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Separator className="min-w-4 flex-0" />
                      <span className="text-muted-foreground text-xs">
                        Pattern
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 px-4 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {[
                          "$type",
                          "$key",
                          "$summary",
                          "$parentkey",
                          "$link",
                        ].map((key) => (
                          <Badge
                            key={key}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setPattern(pattern + key);
                              patternInputRef.current?.focus();
                            }}
                            variant="outline"
                            className="font-mono text-xs cursor-pointer select-none hover:bg-primary/10"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          ref={patternInputRef}
                          className="pr-8 tracking-wider"
                          value={patternReady ? pattern : ""}
                          onChange={(e) => setPattern(e.target.value)}
                          placeholder="Enter branchname pattern"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px] rounded-full outline inline-flex items-center justify-center">
                              <span className="select-none cursor-default text-xs font-medium text-muted-foreground">
                                ?
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-sm p-3">
                            <div className="text-xs space-y-2">
                              <p className="font-medium">
                                Available placeholders
                              </p>
                              <ul className="flex flex-col gap-2">
                                <li>
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $type
                                  </code>
                                  <span className="ml-2">
                                    Prefix by issue type
                                  </span>
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $key
                                  </code>
                                  <span className="ml-2">
                                    Ticket key, e.g., ABC-123
                                  </span>
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $summary
                                  </code>
                                  <span className="ml-2">
                                    Normalized summary
                                  </span>
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $parentkey
                                  </code>
                                  <span className="ml-2">
                                    Parent key if present
                                  </span>
                                </li>
                                <li className="col-span-2">
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $link
                                  </code>
                                  <span className="ml-2">Ticket URL</span>
                                </li>
                              </ul>

                              <p className="font-medium pt-3">Example</p>
                              <div className="flex flex-col gap-2">
                                <p>
                                  <span>Pattern:</span>{" "}
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    $type/$key/$summary
                                  </code>
                                </p>
                                <p>
                                  <span>Output:</span>{" "}
                                  <code className="px-1 py-0.5 bg-muted text-foreground rounded font-mono">
                                    feature/ABC-123/add-login-button
                                  </code>
                                </p>
                              </div>

                              <p>
                                Notes: Whitespace and special characters are
                                replaced according to your settings. Leading or
                                duplicate slashes are cleaned automatically.
                                Tip: Click a badge above to insert a
                                placeholder.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Separator className="min-w-4 flex-0" />
                      <span className="text-muted-foreground text-xs">
                        Preferences
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5 px-4 mt-2">
                      <div className="flex items-center gap-3 h-[26px]">
                        <Checkbox
                          id="romanize-umlauts"
                          checked={umlauts.value}
                          onCheckedChange={(v) => umlauts.setValue(Boolean(v))}
                        />
                        <Label htmlFor="romanize-umlauts">
                          Romanize German letters (ä→ae, ö→oe, ü→ue; ß→ss)
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 h-[26px]">
                        <Checkbox
                          id="make-branchname-lowercase"
                          checked={lower.value}
                          onCheckedChange={(v) => lower.setValue(Boolean(v))}
                        />
                        <Label htmlFor="make-branchname-lowercase">
                          Make branchname lowercase
                        </Label>
                      </div>

                      <div className="flex items-center gap-3 h-[26px]">
                        <Checkbox
                          id="whitespace-replacement"
                          checked={spaces.value}
                          onCheckedChange={(v) => spaces.setValue(Boolean(v))}
                        />
                        <Label htmlFor="whitespace-replacement">
                          Replace whitespace with
                        </Label>
                        <Input
                          className="flex-0 min-w-12 px-1 py-0.5 h-[26px] text-center"
                          value={replWS.value}
                          onChange={(e) =>
                            replWS.setValue(e.currentTarget.value)
                          }
                        />
                      </div>

                      <div className="flex items-center gap-3 h-[26px]">
                        <Checkbox
                          id="special-char-replacement"
                          checked={special.value}
                          onCheckedChange={(v) => special.setValue(Boolean(v))}
                        />
                        <Label htmlFor="special-char-replacement">
                          Replace special characters with
                        </Label>
                        <Input
                          className="flex-0 min-w-12 px-1 py-0.5 h-[26px] text-center"
                          value={replSpec.value}
                          onChange={(e) =>
                            replSpec.setValue(e.currentTarget.value)
                          }
                        />
                      </div>

                      <Separator className="bg-border/60" />

                      <div className="flex items-center gap-3 h-[26px]">
                        <Label>Max. branchname length</Label>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          className="flex-0 min-w-20 pl-2 pr-1 py-0.5 h-[26px]"
                          value={maxLen.value}
                          onChange={(e) => {
                            const n = Math.max(
                              1,
                              Math.min(200, Number(e.currentTarget.value) || 0)
                            );
                            maxLen.setValue(n);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings" className="">
              <div className="flex flex-col gap-4 pt-2.5 pb-3">
                <div className="flex items-center gap-2">
                  <Separator className="min-w-4 flex-0" />
                  <span className="text-muted-foreground text-xs">
                    Settings
                  </span>
                </div>
                <div className="flex flex-col gap-3 px-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="jira-base-url">Jira base URL</Label>
                    <Input
                      id="jira-base-url"
                      placeholder="https://yourcompany.atlassian.net"
                      value={jiraBase.value}
                      onChange={(e) => jiraBase.setValue(e.currentTarget.value)}
                      onBlur={(e) =>
                        jiraBase.setValue(normalizeBase(e.currentTarget.value))
                      }
                      className="max-w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only protocol + host are used. Example:
                      https://tickets.soptim.de
                    </p>
                  </div>

                  <Separator />
                  <ClearStorageButton />

                  <Separator />
                  <div className="flex gap-2 text-sm justify-center">
                    <a
                      href="https://github.com/hadihassandev/j2c"
                      className="hover:underline text-primary"
                    >
                      GitHub
                    </a>
                    <span>·</span>
                    <a
                      href="https://github.com/hadihassandev/j2c/issues"
                      className="hover:underline text-primary"
                    >
                      Report Bug
                    </a>
                    <span>·</span>
                    <a
                      href="https://github.com/hadihassandev/j2c/pulls"
                      className="hover:underline text-primary"
                    >
                      Contribute
                    </a>
                    <span>·</span>
                    <a
                      href="https://github.com/hadihassandev/j2c/issues"
                      className="hover:underline text-primary"
                    >
                      Request Feature
                    </a>
                  </div>
                  <div className="flex flex-col items-center text-xs font-light">
                    <span>Created by: Hadi Hassan</span>
                    <span>Version: 5.0.0</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
