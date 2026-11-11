import React from "react";
import { render } from "@testing-library/react-native";
import { SmagSpinner, SmagLoadingScreen } from "../src/components/SmagSpinner";

describe("SmagSpinner", () => {
  it("renders with default accessibility role and label", () => {
    const { getByTestId, getByLabelText } = render(<SmagSpinner />);

    expect(getByTestId("smag-spinner")).toBeTruthy();
    expect(getByLabelText("Loading...")).toBeTruthy();
  });

  it("renders with custom size", () => {
    const { getByTestId } = render(<SmagSpinner size={72} />);
    const spinner = getByTestId("smag-spinner");
    expect(spinner.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 72, height: 72 })])
    );
  });

  it("renders full-screen SmagLoadingScreen", () => {
    const { getByTestId } = render(<SmagLoadingScreen />);
    expect(getByTestId("smag-loading-screen-spinner")).toBeTruthy();
  });
});
