"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  useGMBAccount,
  useGMBHistory,
  useGMBSchedules,
  useGMBTrends,
  generateGMBContent,
  validateGMBContent,
  postGMBContent,
  initiateGmbOAuth,
  automateGMBPost,
} from "@/lib/hooks/gmb";

type ScheduleMode = "now" | "daily" | "weekly" | "monthly";

export default function GMBPostAutomationCenter() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [seasonPreset, setSeasonPreset] = useState<
    "none" | "winter" | "summer" | "monsoon" | "festive"
  >("none");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationChecks, setValidationChecks] = useState<
    { label: string; passed: boolean; message?: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  const charsUsed = content.length;
  const maxChars = 1500;

  const { data: accountResp } = useGMBAccount();
  const account = accountResp?.data;

  const { data: trendsResp } = useGMBTrends();
  const trends = trendsResp?.data || [];

  const { data: historyResp } = useGMBHistory();
  const historyItems = historyResp?.data || [];

  const { data: scheduleResp, update: updateSchedule } = useGMBSchedules();
  const scheduleConfig = scheduleResp?.data;

  async function handleConnectGMB() {
    setIsConnecting(true);
    setStatusMessage("Preparing Google OAuth...");
    try {
      const res = await initiateGmbOAuth();
      if (res.success && res.authUrl) {
        setStatusMessage("Redirecting to Google for authorization...");
        window.location.href = res.authUrl;
        return;
      }
      setStatusMessage(res.error || "Unable to start Google OAuth. Please try again.");
    } catch (err) {
      setStatusMessage("Failed to communicate with backend for OAuth. Try again later.");
    } finally {
      // only reset if still on page (no redirect was triggered)
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    if (scheduleConfig) {
      // initialise from backend schedule once
      if (scheduleConfig.daily) setScheduleMode("daily");
      else if (scheduleConfig.weekly) setScheduleMode("weekly");
      else if (scheduleConfig.monthly) setScheduleMode("monthly");
      else setScheduleMode("now");
      setSeasonPreset(scheduleConfig.seasonalPreset || "none");
    }
  }, [scheduleConfig]);

  const nextRunLabel = useMemo(() => {
    if (!scheduleConfig?.nextRunAt) return "Not scheduled";
    try {
      return new Date(scheduleConfig.nextRunAt).toLocaleString();
    } catch {
      return scheduleConfig.nextRunAt;
    }
  }, [scheduleConfig?.nextRunAt]);

  async function handleGenerate(kind: "custom" | "seasonal" | "disease") {
    setIsGenerating(true);
    setStatusMessage("Generating content with AI...");
    try {
      const payload: { topic?: string; preset?: string } = {};
      if (kind === "custom" && customTopic) {
        payload.topic = customTopic;
      } else if (kind === "seasonal") {
        payload.preset = seasonPreset !== "none" ? seasonPreset : "seasonal";
      } else if (kind === "disease" && trends[0]) {
        payload.topic = trends[0].disease;
        payload.preset = "disease";
      }

      const res = await generateGMBContent(payload);
      if (res.success && res.data) {
        if (res.data.title) setTitle(res.data.title);
        if (res.data.content) setContent(res.data.content);
        setStatusMessage("AI draft generated. Please review and validate.");
      } else {
        setStatusMessage(res.error || "Failed to generate content.");
      }
    } catch (err: any) {
      setStatusMessage("Error while generating content");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleValidate() {
    setIsValidating(true);
    setStatusMessage("Validating post against GMB rules...");
    try {
      const res = await validateGMBContent({ title, content });
      setValidationChecks(res.checks || []);
      if (res.valid) {
        setStatusMessage("Post is valid ");
      } else {
        setStatusMessage("Validation failed. See checks below.");
      }
      return res.valid;
    } catch (err: any) {
      setStatusMessage("Validation error");
      return false;
    } finally {
      setIsValidating(false);
    }
  }

  async function handlePost() {
    setIsPosting(true);
    setStatusMessage("Preparing to post to Google Business Profile...");

    const ok = await handleValidate();
    if (!ok && !autoApprove) {
      setIsPosting(false);
      setStatusMessage("Post blocked: validation failed and Auto-approve is OFF.");
      return;
    }

    try {
      const res = await postGMBContent({
        title,
        content,
        autoApprove,
        schedule: scheduleMode,
        preset: seasonPreset,
      });
      if (res.success) {
        setStatusMessage(
          `Post queued for GMB successfully (Post ID: ${res.postId || "pending"}).`,
        );
      } else {
        setStatusMessage(res.error || "Failed to post to GMB");
      }
    } catch (err: any) {
      setStatusMessage("Error while posting to GMB");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleAutomate(postContent: string) {
    if (!postContent) {
      setStatusMessage("No content to post.");
      return;
    }
    setStatusMessage("Starting browser automation...");
    try {
      const res = await automateGMBPost({ content: postContent });
      if (res.success) {
        setStatusMessage("Automation started! Check your browser window.");
      } else {
        setStatusMessage(res.error || "Failed to start automation.");
      }
    } catch (err) {
      setStatusMessage("Error starting automation.");
    }
  }

  function handleScheduleModeChange(mode: ScheduleMode) {
    setScheduleMode(mode);
    if (!scheduleConfig) return;
    updateSchedule.mutate({
      ...scheduleConfig,
      daily: mode === "daily",
      weekly: mode === "weekly",
      monthly: mode === "monthly",
    });
  }

  function handleSeasonPresetChange(preset: typeof seasonPreset) {
    setSeasonPreset(preset);
    if (!scheduleConfig) return;
    updateSchedule.mutate({
      ...scheduleConfig,
      seasonalPreset: preset,
    });
  }

  const hasValidationIssues = validationChecks.some((c) => !c.passed);

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">GMB Post Automation Center</h1>
        <p className="text-muted-foreground">
          AI-powered Google Business Profile posting, scheduling, and disease/seasonal
          automation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: connection + composer */}
        <div className="space-y-4 lg:col-span-2">
          {/* Connection card */}
          <Card>
            <CardHeader>
              <CardTitle>GMB Account Connection</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Business:</span>{" "}
                  {account?.businessName || "Not connected"}
                </div>
                <div>
                  <span className="font-medium">Location ID:</span>{" "}
                  {account?.locationId || "-"}
                </div>
                <div>
                  <span className="font-medium">User:</span>{" "}
                  {account?.connectedUser || "-"}
                </div>
                <div>
                  <span className="font-medium">Token:</span>{" "}
                  {account?.tokenExpiresAt ? (
                    <>
                      Expires {new Date(account.tokenExpiresAt).toLocaleString()}
                    </>
                  ) : (
                    "Unknown"
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isConnecting}
                  onClick={handleConnectGMB}
                >
                  Connect / Manage GMB
                </Button>
                <Button variant="outline" size="sm">
                  Refresh Token
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Composer */}
          <Card>
            <CardHeader>
              <CardTitle>Post Composer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short title for your GMB post"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Write or generate your Google Business Profile post content..."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Characters: {charsUsed} / {maxChars}
                  </span>
                  <span className={charsUsed > maxChars ? "text-red-600" : ""}>
                    {charsUsed > maxChars ? "Over limit" : "Within limit"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Topic (for AI)</label>
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Dengue awareness for monsoon in India"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate("custom")}
                  disabled={isGenerating}
                >
                  Generate with OpenAI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate("seasonal")}
                  disabled={isGenerating}
                >
                  Seasonal Post
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate("disease")}
                  disabled={isGenerating || trends.length === 0}
                >
                  Trending Disease Post
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  Validate
                </Button>
                <Button size="sm" onClick={handlePost} disabled={isPosting}>
                  Post / Schedule
                </Button>
                <div className="flex items-center gap-2 ml-auto text-sm">
                  <span>Auto-approve</span>
                  <Switch
                    checked={autoApprove}
                    onCheckedChange={(val) => setAutoApprove(!!val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: scheduler + suggestions + validation summary */}
        <div className="space-y-4">
          {/* Scheduler panel */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Mode</div>
                <div className="flex flex-wrap gap-2">
                  {(["now", "daily", "weekly", "monthly"] as ScheduleMode[]).map(
                    (mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={scheduleMode === mode ? "default" : "outline"}
                        onClick={() => handleScheduleModeChange(mode)}
                      >
                        {mode === "now" ? "Post Now" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Seasonal Preset</div>
                <div className="flex flex-wrap gap-2">
                  {([
                    "none",
                    "winter",
                    "summer",
                    "monsoon",
                    "festive",
                  ] as typeof seasonPreset[]).map((preset) => (
                    <Button
                      key={preset}
                      size="xs"
                      variant={seasonPreset === preset ? "default" : "outline"}
                      onClick={() => handleSeasonPresetChange(preset)}
                    >
                      {preset === "none"
                        ? "None"
                        : preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Automation</div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Next scheduled post: {nextRunLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Trending Suggestions (India)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {trends.length === 0 ? (
                <p className="text-muted-foreground">
                  No disease trends loaded yet. Backend will populate this from news/health
                  sources.
                </p>
              ) : (
                <ul className="space-y-1">
                  {trends.map((t, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <div>
                        <div className="font-medium">{t.disease}</div>
                        <div className="text-muted-foreground">{t.summary}</div>
                      </div>
                      <Badge variant="outline">{t.region}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Validation & compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Validation & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {!validationChecks.length ? (
                <p className="text-muted-foreground">
                  Run validation to see GMB policy checks and safety analysis.
                </p>
              ) : (
                <ul className="space-y-1">
                  {validationChecks.map((check, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span>{check.label}</span>
                      <span
                        className={
                          check.passed ? "text-green-600 font-medium" : "text-red-600 font-medium"
                        }
                      >
                        {check.passed ? "OK" : check.message || "Issue"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {hasValidationIssues && (
                <p className="text-[10px] text-red-600">
                  Some checks failed. Consider editing or using AI rewrite on backend before
                  posting.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Preset</th>
                    <th className="py-2 pr-4">Views</th>
                    <th className="py-2 pr-4">Clicks</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {new Date(item.postedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 max-w-xs truncate">
                        {item.title || "(no title)"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={
                            item.status === "published"
                              ? "default"
                              : item.status === "failed"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {item.preset || "-"}
                      </td>
                      <td className="py-2 pr-4 text-xs">{item.engagement?.views ?? 0}</td>
                      <td className="py-2 pr-4 text-xs">{item.engagement?.clicks ?? 0}</td>
                      <td className="py-2 pr-4 text-xs">{item.engagement?.clicks ?? 0}</td>
                      <td className="py-2 pr-4 text-xs flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setTitle(item.title);
                            setContent(item.content || "");
                            setStatusMessage("Loaded post into composer. You can edit and repost.");
                          }}
                        >
                          Reuse
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleAutomate(item.content || "")}
                        >
                          Auto-Post
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {statusMessage && (
        <div className="text-xs text-muted-foreground">Status: {statusMessage}</div>
      )}
    </div>
  );
}
