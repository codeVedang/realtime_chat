import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { users: string[] };

export default function OnlineUsers({ users }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Users ({users.length})</Text>
      {users.length > 0 ? (
        users.map(u => <Text key={u} style={styles.user}>{u}</Text>)
      ) : (
        <Text style={styles.empty}>No users online</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, borderBottomWidth: 1, borderColor: "#333" },
  title: { fontWeight: "bold", marginBottom: 4, color: "#fff" },
  user: { fontSize: 14, marginVertical: 2, color: "#ddd" },
  empty: { fontSize: 14, fontStyle: "italic", color: "#888" },
});
