import { DeskThingServer } from "@/server/DeskThingServer";
import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { ServerState } from ".";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import ImageColors from "react-native-image-colors";

interface PlayScreenProps {
  serverState: ServerState;
}

const darkenColor = (color: string, amount: number) => {
  let usePound = false;
  if (color[0] === "#") {
    color = color.slice(1);
    usePound = true;
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) - amount * 255;
  let g = ((num >> 8) & 0x00ff) - amount * 255;
  let b = (num & 0x0000ff) - amount * 255;

  r = r < 0 ? 0 : r;
  g = g < 0 ? 0 : g;
  b = b < 0 ? 0 : b;

  return (
    (usePound ? "#" : "") +
    ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
  );
};

const PlayScreen: React.FC<PlayScreenProps> = ({
  serverState,
}: PlayScreenProps) => {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const [accentColor, setAccentColor] = React.useState<string | null>(null);
  const backgroundColor = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const fetchColors = async () => {
      const result = await ImageColors.getColors(
        `data:image/png;base64,${serverState.trackInfo.AlbumArt}`,
        {
          fallback: "#000000",
          cache: true,
          key: serverState.trackInfo.AlbumArt,
        }
      );

      console.log(result);

      if (result.platform === "android") {
        setAccentColor(result.vibrant);
      } else if (result.platform === "ios") {
        setAccentColor(result.primary);
      } else {
        setAccentColor(result.dominant);
      }
    };

    fetchColors();
  }, [serverState.trackInfo.AlbumArt]);

  React.useEffect(() => {
    if (accentColor) {
      Animated.timing(backgroundColor, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [accentColor]);

  const interpolatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "#121212",
      accentColor ? darkenColor(accentColor, 0.1) : "#121212",
    ],
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: interpolatedBackgroundColor },
      ]}
    >
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
    </Animated.View>
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
    marginBottom: 32,
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
