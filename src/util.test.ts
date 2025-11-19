import { describe, expect, it, mock } from "bun:test";
import { isNumericStr, withRetry } from "./util";

describe("withRetry", () => {
  it("returns value when fn resolves on first try", async () => {
    const fn = mock(() => Promise.resolve("OK"));
    const res = await withRetry(fn, 3);
    expect(res).toBe("OK");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const err = new Error("boom");
    const fn = mock()
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.resolve("OK"));

    const res = await withRetry(fn, 4);
    expect(res).toBe("OK");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws last error after all retries fail", async () => {
    const err = new Error("boom");
    const fn = mock()
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.reject(err));

    expect(withRetry(fn, 3)).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("on error test", async () => {
    const err = new Error("boom");
    const fn = mock()
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.reject(err))
      .mockImplementationOnce(() => Promise.resolve("OK"));
    const onError = mock();

    const res = await withRetry(fn, 4, onError);
    expect(res).toBe("OK");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});

it("isNumericStr", () => {
  expect(isNumericStr("5")).toBe(true);
  expect(isNumericStr("0.5")).toBe(true);
  expect(isNumericStr("0,5")).toBe(false);
  expect(isNumericStr("")).toBe(false);
})