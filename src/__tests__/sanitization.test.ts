import {
  sanitizeInput,
  detectSuspiciousPatterns,
} from "../validation/sanitization";
import { validateCommentContent } from "../validation/content-validation";

describe("sanitizeInput", () => {
  it("should preserve markdown formatting characters", () => {
    const input =
      '**Bold** with `code` and "quotes" and /slashes/ and <angles>';
    const result = sanitizeInput(input, { allowHtml: false });
    expect(result).toBe(input);
  });

  it("should preserve common markdown patterns", () => {
    const cases = [
      "# Heading",
      "- list item",
      "[link](https://example.com)",
      "> blockquote with 'quotes'",
      "a & b",
      "1 < 2 > 0",
      'key="value"',
    ];
    for (const input of cases) {
      expect(sanitizeInput(input, { allowHtml: false })).toBe(input);
    }
  });

  it("should strip <script> tags", () => {
    const input = 'Hello <script>alert("xss")</script> world';
    const result = sanitizeInput(input, { allowHtml: false });
    expect(result).not.toContain("<script");
    expect(result).toContain("Hello");
    expect(result).toContain("world");
  });

  it("should strip javascript: URLs", () => {
    const input = "click javascript:alert(1) here";
    const result = sanitizeInput(input, { allowHtml: false });
    expect(result).not.toContain("javascript:");
  });

  it("should strip event handler attributes", () => {
    const input = 'tag onclick= "alert(1)"';
    const result = sanitizeInput(input, { allowHtml: false });
    expect(result).not.toContain("onclick=");
  });

  it("should remove null bytes and control characters", () => {
    const input = "hello\x00\x01world";
    const result = sanitizeInput(input);
    expect(result).toBe("helloworld");
  });

  it("should trim whitespace by default", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("should enforce maxLength", () => {
    const result = sanitizeInput("abcdefgh", { maxLength: 5 });
    expect(result).toBe("abcde");
  });
});

describe("validateCommentContent", () => {
  it("should pass through markdown content unchanged", () => {
    const markdown =
      '**Bold** with `code` and "quotes" and /slashes/ and <angles>';
    expect(validateCommentContent(markdown)).toBe(markdown);
  });

  it("should reject empty content", () => {
    expect(() => validateCommentContent("")).toThrow();
  });
});

describe("detectSuspiciousPatterns", () => {
  it("should detect script tags in raw content", () => {
    const patterns = detectSuspiciousPatterns("<script>alert(1)</script>");
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("should not flag normal markdown", () => {
    const patterns = detectSuspiciousPatterns(
      '**Bold** "quotes" /slashes/ <angles>'
    );
    expect(patterns.length).toBe(0);
  });
});
