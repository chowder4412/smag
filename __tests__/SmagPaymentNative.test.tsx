import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SmagPaymentNative } from "../src/screens/native/SmagPaymentNative";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ orderId: "order-1", amount: "14490", email: "chef@smag.com" })
}));

jest.mock("@/lib/useAppRouter", () => ({ useAppRouter: () => mockRouter }));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" }
}));

const mockChargeCard = jest.fn();
const mockSubmitChallenge = jest.fn();
const mockCancelOrder = jest.fn();

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(),
  httpsCallable: (_functions: unknown, name: string) => {
    if (name === "chargeCard") return mockChargeCard;
    if (name === "submitChargeChallenge") return mockSubmitChallenge;
    if (name === "cancelPendingOrder") return mockCancelOrder;
    return jest.fn();
  }
}));

jest.mock("firebase/app", () => ({ getApp: jest.fn() }));

describe("SmagPaymentNative", () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
    mockRouter.back.mockReset();
    mockChargeCard.mockReset();
    mockSubmitChallenge.mockReset();
    mockCancelOrder.mockReset();
  });

  it("renders the amount and card form", () => {
    const { getByText, getByPlaceholderText } = render(<SmagPaymentNative />);
    expect(getByText("₦14,490")).toBeTruthy();
    expect(getByPlaceholderText("0000 0000 0000 0000")).toBeTruthy();
    expect(getByPlaceholderText("MM/YY")).toBeTruthy();
  });

  it("shows alert for incomplete card details", async () => {
    const { Alert } = require("react-native");
    jest.spyOn(Alert, "alert");

    const { getByText } = render(<SmagPaymentNative />);
    fireEvent.press(getByText(/Pay ₦/));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid Card", expect.any(String));
    });
    expect(mockChargeCard).not.toHaveBeenCalled();
  });

  it("calls chargeCard and navigates to track order on success", async () => {
    jest.useFakeTimers();
    mockChargeCard.mockResolvedValue({ data: { status: "success", reference: "ref-1", displayText: null } });

    const { getByPlaceholderText, getByText } = render(<SmagPaymentNative />);

    fireEvent.changeText(getByPlaceholderText("John Doe"), "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("0000 0000 0000 0000"), "4084 0840 8408 4081");
    fireEvent.changeText(getByPlaceholderText("MM/YY"), "12/26");
    fireEvent.changeText(getByPlaceholderText("•••"), "123");
    fireEvent.press(getByText(/Pay ₦/));

    await waitFor(() => expect(mockChargeCard).toHaveBeenCalled());
    jest.advanceTimersByTime(1500);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/smag_track_order?orderId=order-1"));
    jest.useRealTimers();
  });

  it("shows PIN step when chargeCard returns send_pin", async () => {
    mockChargeCard.mockResolvedValue({ data: { status: "send_pin", reference: "ref-2", displayText: "Enter your PIN" } });

    const { getByPlaceholderText, getByText } = render(<SmagPaymentNative />);

    fireEvent.changeText(getByPlaceholderText("John Doe"), "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("0000 0000 0000 0000"), "4084 0840 8408 4081");
    fireEvent.changeText(getByPlaceholderText("MM/YY"), "12/26");
    fireEvent.changeText(getByPlaceholderText("•••"), "123");
    fireEvent.press(getByText(/Pay ₦/));

    await waitFor(() => {
      expect(getByText("Enter Card PIN")).toBeTruthy();
    });
  });

  it("shows OTP step when chargeCard returns send_otp", async () => {
    mockChargeCard.mockResolvedValue({ data: { status: "send_otp", reference: "ref-3", displayText: "Enter OTP sent to phone" } });

    const { getByPlaceholderText, getByText } = render(<SmagPaymentNative />);

    fireEvent.changeText(getByPlaceholderText("John Doe"), "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("0000 0000 0000 0000"), "4084 0840 8408 4081");
    fireEvent.changeText(getByPlaceholderText("MM/YY"), "12/26");
    fireEvent.changeText(getByPlaceholderText("•••"), "123");
    fireEvent.press(getByText(/Pay ₦/));

    await waitFor(() => {
      expect(getByText("Enter OTP")).toBeTruthy();
    });
  });

  it("cancels pending order and shows error when chargeCard throws", async () => {
    mockChargeCard.mockRejectedValue(new Error("Card declined"));
    mockCancelOrder.mockResolvedValue({});

    const { Alert } = require("react-native");
    jest.spyOn(Alert, "alert");

    const { getByPlaceholderText, getByText } = render(<SmagPaymentNative />);

    fireEvent.changeText(getByPlaceholderText("John Doe"), "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("0000 0000 0000 0000"), "4084 0840 8408 4081");
    fireEvent.changeText(getByPlaceholderText("MM/YY"), "12/26");
    fireEvent.changeText(getByPlaceholderText("•••"), "123");
    fireEvent.press(getByText(/Pay ₦/));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Payment Failed", "Card declined");
      expect(mockCancelOrder).toHaveBeenCalledWith({ orderId: "order-1" });
    });
  });
});
