import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type Props = { children: ReactNode; fallbackLabel?: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.props.fallbackLabel ?? this.state.error.message}
          </Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    color: colors.onBackground,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center"
  },
  message: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 15
  }
});
