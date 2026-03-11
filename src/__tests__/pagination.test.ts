import { describe, expect, test, jest } from "@jest/globals";
import { fetchAllPaginated } from "../utils/api-helpers.js";

interface PaginatedResponse<T> {
  results: T[];
  nextCursor: string | null;
}

type FetchPage<T> = (
  cursor?: string | null
) => Promise<PaginatedResponse<T>>;

describe("fetchAllPaginated", () => {
  test("collects items across multiple pages", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValueOnce({ results: [1, 2, 3], nextCursor: "cursor-1" })
      .mockResolvedValueOnce({ results: [4, 5, 6], nextCursor: "cursor-2" })
      .mockResolvedValueOnce({ results: [7], nextCursor: null });

    const items = await fetchAllPaginated(fetchPage);

    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  test("handles single page with null cursor", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValueOnce({ results: [1, 2], nextCursor: null });

    const items = await fetchAllPaginated(fetchPage);

    expect(items).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("handles empty results", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValueOnce({ results: [], nextCursor: null });

    const items = await fetchAllPaginated(fetchPage);

    expect(items).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("stops early when maxItems is reached", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValueOnce({ results: [1, 2, 3], nextCursor: "cursor-1" })
      .mockResolvedValueOnce({ results: [4, 5, 6], nextCursor: "cursor-2" });

    const items = await fetchAllPaginated(fetchPage, 4);

    expect(items).toEqual([1, 2, 3, 4]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  test("handles empty string cursor as falsy", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValueOnce({ results: [1, 2], nextCursor: "" as string | null });

    const items = await fetchAllPaginated(fetchPage);

    expect(items).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test("enforces safety limit of 50 pages", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockResolvedValue({ results: [1], nextCursor: "next" });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const items = await fetchAllPaginated(fetchPage);

    // 50 pages collected before safety limit kicks in on page 51
    expect(items.length).toBe(50);
    expect(fetchPage).toHaveBeenCalledTimes(50);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Safety limit reached")
    );

    consoleSpy.mockRestore();
  });

  test("propagates errors from fetchPage", async () => {
    const fetchPage: FetchPage<number> = jest
      .fn<FetchPage<number>>()
      .mockRejectedValueOnce(new Error("API error"));

    await expect(fetchAllPaginated(fetchPage)).rejects.toThrow("API error");
  });
});
