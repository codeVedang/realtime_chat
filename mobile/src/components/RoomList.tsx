import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  rooms: string[];
  currentRoom: string;
  onSelectRoom: (room: string) => void;
};

export default function RoomList({ rooms, currentRoom, onSelectRoom }: Props) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.title}>Rooms</Text>
      {rooms.map((room) => (
        <TouchableOpacity
          key={room}
          style={[styles.roomBtn, currentRoom === room && styles.activeRoom]}
          onPress={() => onSelectRoom(room)}
        >
          <Text style={[styles.roomText, currentRoom === room && styles.activeRoomText]}>
            {room}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { padding: 10, backgroundColor: "#1e1e1e" },
  title: { color: "#fff", fontWeight: "bold", marginBottom: 10, fontSize: 16 },
  roomBtn: { padding: 10, borderRadius: 6, marginBottom: 6, backgroundColor: "#2a2a2a" },
  activeRoom: { backgroundColor: "#007AFF" },
  roomText: { fontSize: 15, color: "#ddd" },
  activeRoomText: { color: "#fff", fontWeight: "600" },
});
