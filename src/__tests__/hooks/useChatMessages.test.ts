import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatMessages } from "@/hooks/useChatMessages";
import type { ChatMessage } from "@/services/tauri";

const mockGetChatMessages =
  vi.fn<(sessionId: string, cwd: string) => Promise<ChatMessage[]>>();

vi.mock("@/services/tauri", () => ({
  getChatMessages: (sessionId: string, cwd: string) =>
    mockGetChatMessages(sessionId, cwd),
}));

function makeMsg(id: string): ChatMessage {
  return {
    id,
    role: "assistant",
    content: `msg-${id}`,
    timestamp: Date.now() / 1000,
  };
}

async function flushPromises() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("useChatMessages", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetChatMessages.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads messages on mount", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    const { result } = renderHook(() =>
      useChatMessages("s1", "/tmp", "processing"),
    );

    await flushPromises();

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe("1");
  });

  it("polls every 3 seconds", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    renderHook(() => useChatMessages("s1", "/tmp", "processing"));

    await flushPromises();
    expect(mockGetChatMessages).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockGetChatMessages).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockGetChatMessages).toHaveBeenCalledTimes(3);
  });

  it("isActive is true for active phase with fresh messages", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    const { result } = renderHook(() =>
      useChatMessages("s1", "/tmp", "processing"),
    );

    await flushPromises();

    expect(result.current.isActive).toBe(true);
  });

  it("isActive is false for non-active phase", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    const { result } = renderHook(() => useChatMessages("s1", "/tmp", "idle"));

    await flushPromises();

    expect(result.current.isActive).toBe(false);
  });

  it("isActive becomes false after 3 stale polls", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    const { result } = renderHook(() =>
      useChatMessages("s1", "/tmp", "processing"),
    );

    await flushPromises();
    expect(result.current.isActive).toBe(true);

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
    }

    expect(result.current.isActive).toBe(false);
  });

  it("resets state when sessionId changes", async () => {
    mockGetChatMessages.mockResolvedValue([makeMsg("1")]);

    const { result, rerender } = renderHook(
      ({ sessionId }) => useChatMessages(sessionId, "/tmp", "processing"),
      { initialProps: { sessionId: "s1" } },
    );

    await flushPromises();
    expect(result.current.messages).toHaveLength(1);

    mockGetChatMessages.mockResolvedValue([makeMsg("a"), makeMsg("b")]);
    rerender({ sessionId: "s2" });

    await flushPromises();

    expect(result.current.messages).toHaveLength(2);
  });
});
