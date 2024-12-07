import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";

interface ConnectionScreenProps {
  saveConnectionParams: (ip: string) => void;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  saveConnectionParams,
}) => {
  const [ip, setIp] = useState("");

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Server IP"
        placeholderTextColor="#888"
        value={ip}
        onChangeText={setIp}
        style={styles.input}
      />
      <Button
        title="Save and Connect"
        onPress={() => saveConnectionParams(ip)}
        color="#1E90FF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    marginBottom: 10,
    padding: 5,
    width: 200,
    color: "white",
  },
});

export default ConnectionScreen;
