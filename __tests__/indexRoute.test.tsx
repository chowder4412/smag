import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import IndexRoute from "../app/index";
import { getLaunchRoute } from "@/lib/startupState";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/startupState", () => ({
  getLaunchRoute: jest.fn()
}));

describe("IndexRoute", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRouter.replace.mockReset();
    (getLaunchRoute as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the animated splash screen on app start", async () => {
    (getLaunchRoute as jest.Mock).mockResolvedValue("/smag_login");

    const { getByText } = render(<IndexRoute />);

    expect(getByText("SMAG")).toBeTruthy();
    expect(getByText("chop better")).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
  });

  it("navigates to /smag_home when splash completes for authenticated user", async () => {
    (getLaunchRoute as jest.Mock).mockResolvedValue("/smag_home");

    const { getByLabelText } = render(<IndexRoute />);

    const continueBtn = getByLabelText("Continue to app");
    fireEvent.press(continueBtn);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_home");
    });
  });

  it("navigates to /smag_login when splash completes for guest user", async () => {
    (getLaunchRoute as jest.Mock).mockResolvedValue("/smag_login");

    const { getByLabelText } = render(<IndexRoute />);

    const continueBtn = getByLabelText("Continue to app");
    fireEvent.press(continueBtn);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_login");
    });
  });
});
