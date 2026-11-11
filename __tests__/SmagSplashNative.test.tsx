import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { SmagSplashNative } from "../src/screens/native/SmagSplashNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/startupState", () => ({
  getLaunchRoute: jest.fn().mockResolvedValue("/smag_home")
}));

describe("SmagSplashNative", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRouter.replace.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the SMAG brand badge, tagline, continue button, and version", () => {
    const { getByText, getByLabelText } = render(
      <SmagSplashNative disableAutoDismiss={true} />
    );

    expect(getByText("SMAG")).toBeTruthy();
    expect(getByText("chop better")).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
    expect(getByText("Ver 1.0")).toBeTruthy();
    expect(getByLabelText("Continue to app")).toBeTruthy();
  });

  it("calls onFinish immediately when Continue is pressed", () => {
    const onFinish = jest.fn();
    const { getByLabelText } = render(
      <SmagSplashNative onFinish={onFinish} disableAutoDismiss={true} />
    );

    const continueBtn = getByLabelText("Continue to app");
    fireEvent.press(continueBtn);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("automatically dismisses and calls onFinish after the 2.5s timer expires", () => {
    const onFinish = jest.fn();
    render(<SmagSplashNative onFinish={onFinish} />);

    expect(onFinish).not.toHaveBeenCalled();

    // Fast-forward past 2500ms auto-dismiss delay
    act(() => {
      jest.advanceTimersByTime(2600);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
