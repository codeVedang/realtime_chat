import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

type Props = {
  backendUrl: string;
  onRoomCreated: (room: string) => void;
};

export default function RoomCreation({ backendUrl, onRoomCreated }: Props) {
  const [newRoom, setNewRoom] = useState("");

  const handleCreate = async () => {
    if (!newRoom.trim()) {
      Alert.alert("Validation", "Please enter a room name");
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/rooms`, { name: newRoom });
      console.log("Room created:", res.data);
      onRoomCreated(newRoom);
      setNewRoom("");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to create room");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="New room name"
        placeholderTextColor="#888"
        value={newRoom}
        onChangeText={setNewRoom}
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  input: { 
    borderWidth: 1, 
    borderColor: "#444", 
    backgroundColor: "#1e1e1e", 
    color: "#fff", 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10 
  },
  btn: { 
    backgroundColor: "#007AFF", 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "600" 
  }
});
