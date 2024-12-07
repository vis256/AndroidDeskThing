import { DeskThingServer } from "@/server/DeskThingServer";
import React from "react";
import { View, Text, Button, StyleSheet, Image, Pressable } from "react-native";
import { ServerState } from ".";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

interface PlayScreenProps {
  serverState: ServerState;
}

const PlayScreen: React.FC<PlayScreenProps> = ({
  serverState,
}: PlayScreenProps) => {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Image
          source={{
            uri: `data:image/png;base64,${serverState.trackInfo.AlbumArt}`,
          }}
          style={styles.albumArt}
        />
        <View style={styles.infoTextContainer}>
          {serverState.trackInfo.Title && (
            <Text style={styles.infoTextTitle}>
              {serverState.trackInfo.Title}
            </Text>
          )}

          {serverState.trackInfo.Artist && (
            <Text style={styles.infoTextArtist}>
              {serverState.trackInfo.Artist}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={() => DeskThingServer.previous()}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons name="play-skip-back" size={48} color="white" />
        </Pressable>
        <Pressable
          onPress={() =>
            serverState.trackInfo.Playing
              ? DeskThingServer.pause()
              : DeskThingServer.play()
          }
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={serverState.trackInfo.Playing ? "pause" : "play"}
            size={48}
            color="white"
          />
        </Pressable>
        <Pressable
          onPress={() => DeskThingServer.next()}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons name="play-skip-forward" size={48} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 20,
  },
  infoTextContainer: {
    flexDirection: "column",
    width: "60%",
  },
  infoTextTitle: {
    fontSize: 48,
    color: "white",
    fontFamily: "Inter_600SemiBold",
  },
  infoTextArtist: {
    fontSize: 28,
    color: "white",
    fontFamily: "Inter_400Regular",
  },
  trackInfo: {
    fontSize: 24,
    color: "white",
    fontFamily: "Inter_400Regular",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
  },
  albumArt: {
    width: 170,
    height: 170,
    backgroundColor: "gray",
  },
});

export default PlayScreen;
