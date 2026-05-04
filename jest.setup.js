// Jest setup hook for shared test initialization.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockIcon = (props) => React.createElement(Text, props, props?.name ?? "icon");
  MockIcon.glyphMap = {};

  return {
    MaterialIcons: MockIcon
  };
});

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "smag://redirect",
  useAuthRequest: () => [{}, null, jest.fn().mockResolvedValue({ type: "dismiss" })]
}));
