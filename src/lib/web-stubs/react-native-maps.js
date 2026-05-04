// react-native-maps is not supported on web.
// This stub prevents the bundler from crashing when importing it on web.
const React = require("react");
const { View } = require("react-native");

const Noop = () => null;
const MapView = React.forwardRef((props, _ref) =>
  React.createElement(View, { style: [{ backgroundColor: "#ffede5", borderRadius: 12 }, props.style] })
);
MapView.displayName = "MapView";

module.exports = {
  default: MapView,
  MapView,
  Marker: Noop,
  Polyline: Noop,
  Circle: Noop,
  Callout: Noop,
  PROVIDER_GOOGLE: "google",
  PROVIDER_DEFAULT: null
};
