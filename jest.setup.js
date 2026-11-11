// Jest setup hook for shared test initialization.
// Increase default timeout to 60s — React Native + jest-expo initialisation
// on Windows/pnpm can take several seconds before the first test assertion.
jest.setTimeout(60000);
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

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    WebView: (props) => React.createElement(View, { testID: "mock-webview", ...props })
  };
});
