import React, { useState, useEffect } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConnectionScreen from "./ConnectionScreen";
import PlayScreen from "./PlayScreen";
import { DeskThingServer } from "../server/DeskThingServer";

export interface ServerState {
  connected: boolean;
  trackInfo: {
    Artist?: string;
    Title?: string;
    Playing: boolean;
    AlbumArt?: string; // base64d png
  };
}

export default function Index() {
  const [ip, setIp] = useState("");
  const [connected, setConnected] = useState(false);
  const [serverState, setServerState] = useState<ServerState>({
    connected: false,
    trackInfo: { Playing: false },
  });

  DeskThingServer.initialize((key, value) => {
    setServerState((prevState) => ({ ...prevState, [key]: value }));
  });

  useEffect(() => {
    const loadConnectionParams = async () => {
      const savedIp = await AsyncStorage.getItem("serverIp");
      if (savedIp) {
        setIp(savedIp);
        tryConnect(savedIp);
      }
    };

    loadConnectionParams();
  }, []);

  const tryConnect = async (ip: string) => {
    console.log(
      "Trying to connect to server",
      ip,
      process.env.EXPO_PUBLIC_HTTP_PORT
    );

    try {
      const response = await fetch(
        `http://${ip}:${process.env.EXPO_PUBLIC_HTTP_PORT!}`
      );
      if (response.ok) {
        console.log("Server exists");
        // Server exists
        DeskThingServer.start(ip, process.env.EXPO_PUBLIC_WEBSOCKET_PORT!);
        setConnected(true);
      } else {
        console.log("Server does not exist");
        setConnected(false);
      }
    } catch (error) {
      setConnected(false);
    }
  };

  const saveConnectionParams = async (ip: string) => {
    console.log(ip);
    await AsyncStorage.setItem("serverIp", ip);
    setIp(ip);
    tryConnect(ip);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
      }}
    >
      {connected ? (
        <>
          <PlayScreen serverState={serverState} />
        </>
      ) : (
        <ConnectionScreen saveConnectionParams={saveConnectionParams} />
      )}
    </View>
  );
}
