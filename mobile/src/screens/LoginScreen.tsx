import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import axios from 'axios';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const backendUrl = "https://realtime-chat-6n47.onrender.com";

  const handleGuestLogin = async () => {
    if (!username.trim()) {
      Alert.alert("Validation", "Please enter a username");
      return;
    }
    try {
      const res = await axios.post(`${backendUrl}/auth/guest`, { username });
      console.log("Guest login:", res.data);
      navigation.navigate("Chat", { user: username });
    } catch (err: any) {
      Alert.alert("Guest login failed", err.message);
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Enter username & password");
      return;
    }
    try {
      const res = await axios.post(`${backendUrl}/auth/register`, { username, password });
      console.log("Register success:", res.data);
      navigation.navigate("Chat", { user: username });
    } catch (err: any) {
      Alert.alert("Register failed", err.response?.data?.error || err.message);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Enter username & password");
      return;
    }
    try {
      const res = await axios.post(`${backendUrl}/auth/login`, { username, password });
      console.log("Login success:", res.data);
      navigation.navigate("Chat", { user: username });
    } catch (err: any) {
      Alert.alert("Login failed", err.response?.data?.error || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Realtime Chat</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#1e90ff" }]} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#28a745" }]} onPress={handleRegister}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#6c757d" }]} onPress={handleGuestLogin}>
        <Text style={styles.btnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#121212",  // Dark background
    padding: 20 
  },
  heading: { 
    fontSize: 28, 
    marginBottom: 30, 
    fontWeight: "bold", 
    color: "#ffffff" 
  },
  input: { 
    borderWidth: 1, 
    width: "80%", 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 8, 
    borderColor: "#333", 
    backgroundColor: "#1e1e1e", 
    color: "#fff", 
    fontSize: 16 
  },
  btn: { 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 8, 
    marginVertical: 6, 
    width: "80%", 
    alignItems: "center" 
  },
  btnText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "600" 
  }
});
