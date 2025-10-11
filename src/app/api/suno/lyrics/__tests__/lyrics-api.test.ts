import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as lyricsCallbackPost } from "@/app/api/suno/lyrics/callback/route";
import { GET as lyricsGet } from "@/app/api/suno/lyrics/route";
import { POST as lyricVersionsPost } from "@/app/api/lyric-versions/route";
import {
  getLyricsTask,
  resetLyricsCache,
  setLyricsTaskComplete,
} from "@/app/api/suno/lyrics/cache";

const getAdminDbMock = vi.fn(() => null as any);

vi.mock("@/lib/adminDb", () => ({
  getAdminDb: () => getAdminDbMock(),
}));

const createAdminDbStub = (captured: any[]) => {
  const createTxProxy = (collection: string, id: string, data: Record<string, any>) => {
    const record = { collection, id, data, links: [] as Record<string, any>[] };
    return {
      link(linkData: Record<string, any>) {
        record.links.push(linkData);
        return this;
      },
      __record: record,
    };
  };

  return {
    tx: {
      lyric_versions: new Proxy(
        {},
        {
          get: (_target, versionId: string) => ({
            update: (data: Record<string, any>) => createTxProxy("lyric_versions", versionId, data),
          }),
        }
      ),
      conversations: new Proxy(
        {},
        {
          get: (_target, conversationId: string) => ({
            update: (data: Record<string, any>) => createTxProxy("conversations", conversationId, data),
          }),
        }
      ),
    },
    async transact(transactions: any[]) {
      transactions.forEach((tx) => {
        if (tx && typeof tx === "object" && "__record" in tx) {
          captured.push(tx.__record);
        }
      });
    },
  };
};

beforeEach(() => {
  resetLyricsCache();
  getAdminDbMock.mockReturnValue(null);
  process.env.SUNO_API_KEY = "test-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("Unexpected fetch invocation")))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  getAdminDbMock.mockReturnValue(null);
});

describe("Suno lyrics callback and polling", () => {
  it("stores variants from callback payload into cache", async () => {
    const payload = {
      data: {
        task_id: "task-123",
        status: "SUCCESS",
        data: [{ text: "Variant A" }, { text: "Variant B" }],
      },
    };

    const request = new NextRequest(
      new Request("http://localhost/api/suno/lyrics/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    const response = await lyricsCallbackPost(request);
    expect(response.status).toBe(200);

    const cached = getLyricsTask("task-123");
    expect(cached).toBeDefined();
    expect(cached?.status).toBe("complete");
    expect(cached?.lyrics).toEqual(["Variant A", "Variant B"]);
  });

  it("returns cached variants from GET endpoint", async () => {
    setLyricsTaskComplete("task-789", ["Variant X", "Variant Y"]);

    const request = new NextRequest(
      new Request("http://localhost/api/suno/lyrics?taskId=task-789", {
        method: "GET",
      })
    );

    const response = await lyricsGet(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("complete");
    expect(body.taskId).toBe("task-789");
    expect(body.variants).toEqual(["Variant X", "Variant Y"]);
    expect(body.lyrics).toContain("Variant X");
    expect(body.lyrics).toContain("Variant Y");
  });
});

describe("Lyric version persistence metadata", () => {
  it("persists selection metadata when provided", async () => {
    const captured: any[] = [];
    getAdminDbMock.mockReturnValue(createAdminDbStub(captured));

    const payload = {
      conversationId: "conv-1",
      messages: [],
      previousLyrics: "Vorige lyrics",
      previousVersion: 2,
      providedLyrics: {
        title: "Kies",
        lyrics: "Variant B tekst",
        style: "romantisch",
        source: "suno",
        variantIndex: 1,
        taskId: "task-456",
        isSelection: true,
        selectedAt: 1234567890,
      },
    };

    const request = new NextRequest(
      new Request("http://localhost/api/lyric-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    const response = await lyricVersionsPost(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    const lyricTx = captured.find((entry) => entry.collection === "lyric_versions");
    expect(lyricTx).toBeDefined();
    expect(lyricTx.data.variantIndex).toBe(1);
    expect(lyricTx.data.variantSource).toBe("suno");
    expect(lyricTx.data.isSelection).toBe(true);
    expect(lyricTx.data.selectedFromTaskId).toBe("task-456");
    expect(lyricTx.data.selectedAt).toBe(1234567890);

    const storedContent = JSON.parse(lyricTx.data.content);
    expect(storedContent.metadata).toMatchObject({
      variantIndex: 1,
      taskId: "task-456",
      isSelection: true,
      selectedAt: 1234567890,
      source: "suno",
    });
  });
});
