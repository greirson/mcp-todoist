import { describe, expect, test, jest } from "@jest/globals";
import { fetchAllPaginated } from "../utils/api-helpers.js";

interface TestItem {
  id: string;
}

interface PaginatedResponse {
  results: TestItem[];
  nextCursor: string | null;
}

type FetchPage = (
  cursor?: string | null
) => Promise<PaginatedResponse>;

describe("fetchAllPaginated", () => {
  test("collects all pages until nextCursor is null", async () => {
    const pages: PaginatedResponse[] = [
      { results: [{ id: "1" }, { id: "2" }], nextCursor: "cursor-2" },
      { results: [{ id: "3" }, { id: "4" }], nextCursor: "cursor-3" },
      { results: [{ id: "5" }], nextCursor: null },
    ];
    let callIndex = 0;
    const cursorsReceived: (string | null | undefined)[] = [];
    const fetchPage: FetchPage = jest.fn(
      async (cursor?: string | null) => {
        cursorsReceived.push(cursor);
        return pages[callIndex++];
      }
    );

    const results = await fetchAllPaginated(fetchPage);

    expect(results).toHaveLength(5);
    expect(cursorsReceived).toEqual([undefined, "cursor-2", "cursor-3"]);
  });

  test("handles single page with nextCursor null", async () => {
    const fetchPage: FetchPage = jest.fn(async () => ({
      results: [{ id: "1" }],
      nextCursor: null,
    }));

    const results = await fetchAllPaginated(fetchPage);

    expect(results).toHaveLength(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("handles empty results", async () => {
    const fetchPage: FetchPage = jest.fn(async () => ({
      results: [] as TestItem[],
      nextCursor: null,
    }));

    const results = await fetchAllPaginated(fetchPage);

    expect(results).toHaveLength(0);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("treats empty string cursor as end of pagination", async () => {
    const fetchPage: FetchPage = jest.fn(async () => ({
      results: [{ id: "1" }],
      nextCursor: "" as unknown as null,
    }));

    const results = await fetchAllPaginated(fetchPage);

    expect(results).toHaveLength(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("stops at maxPages safety limit", async () => {
    let callCount = 0;
    const fetchPage: FetchPage = jest.fn(async () => {
      callCount++;
      return {
        results: [{ id: String(callCount) }],
        nextCursor: `next-${callCount}`,
      };
    });

    // maxPages is 50 internally — this would loop forever without the limit
    const results = await fetchAllPaginated(fetchPage);

    expect(results).toHaveLength(50);
    expect(fetchPage).toHaveBeenCalledTimes(50);
  });

  test("propagates fetch errors", async () => {
    const fetchPage: FetchPage = jest.fn(async () => {
      throw new Error("API error");
    });

    await expect(fetchAllPaginated(fetchPage)).rejects.toThrow("API error");
  });
});
