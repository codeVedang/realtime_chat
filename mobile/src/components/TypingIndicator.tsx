import React from 'react';
import { Text, StyleSheet } from 'react-native';

type Props = { typingUser?: string };

export default function TypingIndicator({ typingUser }: Props) {
  if (!typingUser) return null;
  return <Text style={styles.text}>{typingUser} is typing...</Text>;
}

const styles = StyleSheet.create({
  text: { fontStyle: "italic", color: "#666", marginVertical: 4 }
});
