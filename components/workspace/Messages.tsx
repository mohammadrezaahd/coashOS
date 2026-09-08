"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SendOutlined } from "@mui/icons-material";
import { useWorkspace } from "./WorkspaceProvider";
import { uid } from "./data";
import { Empty, PageHeading, Panel, useDashboard } from "./shared";
export function Messages() {
  const { isCoach, role, id } = useDashboard();
  const { trainees, coachProfile, messages, setMessages } = useWorkspace();
  const search = useSearchParams();
  const [selected, setSelected] = useState(
    search.get("trainee") ?? trainees[0].id,
  );
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const personId = isCoach ? selected : id;
  const person = isCoach
    ? trainees.find((p) => p.id === selected)
    : coachProfile;
  const thread = messages.filter((m) => m.traineeId === personId);
  return (
    <>
      <PageHeading
        eyebrow="Stay connected"
        title="Good coaching is a conversation."
        description="A little guidance can make a big difference."
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: isCoach ? "280px minmax(0,1fr)" : "1fr",
          },
          gap: 2,
        }}
      >
        {isCoach && (
          <Panel>
            <TextField
              label="Find a trainee"
              size="small"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Stack
              sx={{
                mt: 2,
                maxHeight: { xs: 180, md: 510 },
                overflow: "auto",
                gap: 1,
              }}
            >
              {trainees
                .filter((p) =>
                  p.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((p) => (
                  <Button
                    key={p.id}
                    onClick={() => {
                      setSelected(p.id);
                      setText("");
                    }}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      color: "text.primary",
                      bgcolor:
                        selected === p.id ? "action.selected" : "transparent",
                      py: 1.5,
                      gap: 1.5,
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                      {p.name[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {p.level}
                      </Typography>
                    </Box>
                  </Button>
                ))}
            </Stack>
          </Panel>
        )}
        <Panel>
          <Stack
            direction="row"
            sx={{
              pb: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: "green.main", color: "green.sub" }}>
              {person?.name[0]}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                {person?.name ?? "Choose a conversation"}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {isCoach ? "Trainee" : "Your coach"}
              </Typography>
            </Box>
          </Stack>
          <Box
            aria-live="polite"
            sx={{ minHeight: 310, maxHeight: 460, overflow: "auto", py: 3 }}
          >
            <Stack sx={{ gap: 2 }}>
              {thread.map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    alignSelf: m.sender === role ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor:
                        m.sender === role ? "green.main" : "action.hover",
                      color: m.sender === role ? "green.sub" : "text.primary",
                    }}
                  >
                    <Typography sx={{ overflowWrap: "anywhere" }}>
                      {m.text}
                    </Typography>
                  </Box>
                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      textAlign: m.sender === role ? "right" : "left",
                      fontSize: 12,
                    }}
                  >
                    {m.time}
                  </Typography>
                </Box>
              ))}
            </Stack>
            {!thread.length && (
              <Empty
                title="Start the conversation"
                description="Ask a question, share a win, or check in about the plan."
              />
            )}
          </Box>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim() || !person) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: uid(),
                  traineeId: personId,
                  sender: role,
                  text: text.trim(),
                  time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]);
              setText("");
            }}
          >
            <Stack direction="row" sx={{ gap: 1 }}>
              <TextField
                label="Your message"
                multiline
                maxRows={4}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button
                aria-label="Send message"
                type="submit"
                variant="contained"
                disabled={!text.trim() || !person}
              >
                <SendOutlined />
              </Button>
            </Stack>
            <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>
              Preview conversation. Messages are not sent to another person.
            </Typography>
          </Box>
        </Panel>
      </Box>
    </>
  );
}
