import { validateEmail, validateFullName, validatePassword, validatePhone } from "../src/lib/validation";

describe("validateEmail", () => {
  it("rejects empty string", () => {
    expect(validateEmail("")).not.toBeNull();
  });
  it("rejects missing @", () => {
    expect(validateEmail("notanemail")).not.toBeNull();
  });
  it("rejects missing domain", () => {
    expect(validateEmail("user@")).not.toBeNull();
  });
  it("accepts valid email", () => {
    expect(validateEmail("chef@smag.com")).toBeNull();
  });
  it("accepts email with subdomain", () => {
    expect(validateEmail("user@mail.smag.com")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("rejects empty string", () => {
    expect(validatePassword("")).not.toBeNull();
  });
  it("rejects password shorter than 8 chars", () => {
    expect(validatePassword("abc123")).not.toBeNull();
  });
  it("accepts password of exactly 8 chars", () => {
    expect(validatePassword("abcd1234")).toBeNull();
  });
  it("accepts long password", () => {
    expect(validatePassword("superSecurePassword99!")).toBeNull();
  });
});

describe("validatePhone", () => {
  it("rejects empty string", () => {
    expect(validatePhone("")).not.toBeNull();
  });
  it("rejects letters", () => {
    expect(validatePhone("abcdefg")).not.toBeNull();
  });
  it("accepts international format", () => {
    expect(validatePhone("+1 234 567 8900")).toBeNull();
  });
  it("accepts plain digits", () => {
    expect(validatePhone("07911123456")).toBeNull();
  });
});

describe("validateFullName", () => {
  it("rejects empty string", () => {
    expect(validateFullName("")).not.toBeNull();
  });
  it("rejects single character", () => {
    expect(validateFullName("A")).not.toBeNull();
  });
  it("accepts two characters", () => {
    expect(validateFullName("Al")).toBeNull();
  });
  it("accepts full name", () => {
    expect(validateFullName("Alex Thompson")).toBeNull();
  });
});
