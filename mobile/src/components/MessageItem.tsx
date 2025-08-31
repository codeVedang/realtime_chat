import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type MessageItemProps = {
  user: string;
  text: string;
  currentUser: string;
};

export default function MessageItem({ user, text, currentUser }: MessageItemProps) {
  const isOwnMessage = user === currentUser;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!isOwnMessage && <Text style={styles.username}>{user}</Text>}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 10, 
    marginVertical: 4, 
    borderRadius: 10, 
    maxWidth: "70%" 
  },
  ownMessage: { 
    backgroundColor: "#005c4b",   // WhatsApp dark green bubble
    alignSelf: "flex-end" 
  },
  otherMessage: { 
    backgroundColor: "#262d31",   // WhatsApp gray bubble
    alignSelf: "flex-start" 
  },
  username: { 
    fontSize: 12, 
    fontWeight: "bold", 
    marginBottom: 2, 
    color: "#aaa" 
  },
  text: { fontSize: 16, color: "#fff" },
});
