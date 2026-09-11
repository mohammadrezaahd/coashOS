"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { api, useWorkspace } from "./WorkspaceProvider";
import { Empty, FloatingAdd, PageHeading, Panel, useDashboard } from "./shared";
import type { WorkspacePerson } from "@/interfaces/Workspace.interface";
export function Messages() {
  const { isCoach } = useDashboard();
  const { user, conversations, messages, requests, mutate } = useWorkspace();
  const query = useSearchParams();
  const [selected, setSelected] = useState(""),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [find, setFind] = useState(false),
    [q, setQ] = useState(""),
    [coaches, setCoaches] = useState<WorkspacePerson[]>([]);
  const conversation =
    conversations.find((c) => c.id === selected) ??
    conversations.find((c) => c.traineeId === query.get("trainee")) ??
    conversations[0];
  const request = requests.find((r) => r.conversationId === conversation?.id);
  async function act(path: string, method: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await mutate(path, method, body);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Messages"
        description={
          isCoach
            ? "Chat first, then accept a coaching request in the conversation."
            : "Get to know a coach. Send your coaching request here when you’re ready."
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {!isCoach && (
        <FloatingAdd label="Find a coach" onClick={() => setFind(true)} />
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px minmax(0,1fr)" },
          gap: 3,
        }}
      >
        <Panel title="Conversations">
          <Stack sx={{ gap: 1 }}>
            {conversations.map((c) => (
              <Button
                key={c.id}
                variant={conversation?.id === c.id ? "contained" : "text"}
                onClick={() => {
                  setSelected(c.id);
                  setText("");
                }}
                sx={{ justifyContent: "flex-start", py: 2 }}
              >
                {isCoach ? c.traineeName : c.coachName}
                {requests.some(
                  (r) => r.conversationId === c.id && r.status === "pending",
                ) && <Chip size="small" label="Request" sx={{ ml: 1 }} />}
              </Button>
            ))}
            {!conversations.length && (
              <Typography color="text.secondary">
                {isCoach
                  ? "New trainee conversations appear here."
                  : "Find a coach to start a conversation."}
              </Typography>
            )}
          </Stack>
        </Panel>
        {conversation ? (
          <Panel
            title={isCoach ? conversation.traineeName : conversation.coachName}
          >
            <Stack sx={{ gap: 2 }}>
              <Box
                role="log"
                aria-label="Conversation messages"
                aria-live="polite"
                sx={{
                  minHeight: 240,
                  maxHeight: "50dvh",
                  overflowY: "auto",
                  p: 1,
                }}
              >
                {messages
                  .filter((m) => m.conversationId === conversation.id)
                  .map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        ml: m.sender === user!.role ? "auto" : 0,
                        mr: m.sender === user!.role ? 0 : "auto",
                        mb: 2,
                        p: 2,
                        borderRadius: 3,
                        maxWidth: "85%",
                        bgcolor:
                          m.sender === user!.role
                            ? "green.main"
                            : "action.hover",
                        color:
                          m.sender === user!.role
                            ? "green.sub"
                            : "text.primary",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>
                        {m.text}
                      </Typography>
                      <Typography variant="caption">
                        {new Date(m.time).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
              </Box>
              {request && (
                <Alert
                  severity={request.status === "accepted" ? "success" : "info"}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    Coaching request · {request.status}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(request.createdAt).toLocaleString()}
                  </Typography>
                  {request.status === "pending" && (
                    <Stack direction="row" sx={{ gap: 1, mt: 1 }}>
                      {isCoach ? (
                        <>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              act("requests", "PATCH", {
                                id: request.id,
                                status: "accepted",
                              })
                            }
                          >
                            Accept trainee
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              act("requests", "PATCH", {
                                id: request.id,
                                status: "declined",
                              })
                            }
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <Button
                          disabled={busy}
                          onClick={() =>
                            act("requests", "PATCH", {
                              id: request.id,
                              status: "cancelled",
                            })
                          }
                        >
                          Cancel request
                        </Button>
                      )}
                    </Stack>
                  )}
                </Alert>
              )}
              {!isCoach && !user!.coachId && request?.status !== "pending" && (
                <Button
                  variant="outlined"
                  disabled={busy}
                  onClick={() =>
                    act("requests", "POST", { conversationId: conversation.id })
                  }
                >
                  Request coaching from {conversation.coachName}
                </Button>
              )}
              <Box
                component="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await act("messages", "POST", {
                      conversationId: conversation.id,
                      text,
                    })
                  )
                    setText("");
                }}
                sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}
              >
                <TextField
                  fullWidth
                  multiline
                  maxRows={5}
                  label="Your message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 5000 } }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={busy || !text.trim()}
                  aria-label="Send message"
                  sx={{ height: 56, minWidth: 56 }}
                >
                  <Send />
                </Button>
              </Box>
            </Stack>
          </Panel>
        ) : (
          <Empty
            title="Start with a conversation"
            description={
              isCoach
                ? "Trainees can find your profile and message you before requesting coaching."
                : "Use “Find a coach” to search and send a message."
            }
          />
        )}
      </Box>
      <Dialog open={find} onClose={() => setFind(false)} fullWidth>
        <DialogTitle>Find a coach</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const result = await api<{ coaches: WorkspacePerson[] }>(
                  `coaches?q=${encodeURIComponent(q)}`,
                );
                setCoaches(result.coaches);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
            sx={{ display: "flex", gap: 1, my: 2 }}
          >
            <TextField
              fullWidth
              label="Coach name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </Box>
          <Stack sx={{ gap: 2 }}>
            {coaches.map((c) => (
              <Box
                key={c.id}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>{c.name}</Typography>
                <Typography color="text.secondary">
                  {c.bio || c.location || "Coach on coachOS"}
                </Typography>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    if (await act("conversations", "POST", { coachId: c.id })) {
                      setSelected(`${c.id}:${user!.id}`);
                      setFind(false);
                    }
                  }}
                >
                  Start conversation
                </Button>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFind(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
