export class DeskThingServer {
  private static ws?: WebSocket;
  private static state: { [key: string]: any } = {};
  private static updateStateCallback: (key: string, value: any) => void;
  private static reconnectInterval?: NodeJS.Timeout;

  public static initialize(
    updateStateCallback: (key: string, value: any) => void
  ) {
    DeskThingServer.updateStateCallback = updateStateCallback;
  }

  public static start(ip: string, port: string) {
    DeskThingServer.ws = new WebSocket(`ws://${ip}:${port}`);
    console.log(`Attempting to connect to ws://${ip}:${port}`);

    DeskThingServer.setUpListeners(ip, port);
  }

  public static close() {
    if (!DeskThingServer.ws) {
      return;
    }

    DeskThingServer.ws.close();
    if (DeskThingServer.reconnectInterval) {
      clearInterval(DeskThingServer.reconnectInterval);
    }
  }

  private static setUpListeners(ip: string, port: string) {
    if (!DeskThingServer.ws) {
      return;
    }

    DeskThingServer.ws.addEventListener("message", (event) => {
      if (event.data === "No media playing") {
        DeskThingServer.saveState("trackInfo", { Playing: false });
        return;
      }

      DeskThingServer.saveState("trackInfo", JSON.parse(event.data));
    });

    DeskThingServer.ws.onopen = () => {
      console.log("Connected to server");
      DeskThingServer.saveState("connected", true);
      if (DeskThingServer.reconnectInterval) {
        clearInterval(DeskThingServer.reconnectInterval);
      }
    };

    DeskThingServer.ws.onclose = () => {
      console.log("Disconnected from server");
      DeskThingServer.saveState("connected", false);
      DeskThingServer.reconnectInterval = setInterval(() => {
        console.log("Attempting to reconnect...");
        DeskThingServer.start(ip, port);
      }, 5000);
    };
  }

  private static saveState(key: string, value: any) {
    DeskThingServer.state[key] = value;
    DeskThingServer.updateStateCallback(key, value);
  }

  public static play() {
    if (
      DeskThingServer.ws &&
      DeskThingServer.ws.readyState === WebSocket.OPEN
    ) {
      DeskThingServer.ws.send("play");
    } else {
      console.error(
        "WebSocket is not open. Cannot send 'play' command.",
        DeskThingServer.ws
      );
    }
  }

  public static pause() {
    if (
      DeskThingServer.ws &&
      DeskThingServer.ws.readyState === WebSocket.OPEN
    ) {
      DeskThingServer.ws.send("pause");
    } else {
      console.error(
        "WebSocket is not open. Cannot send 'pause' command.",
        DeskThingServer.ws
      );
    }
  }

  public static next() {
    if (
      DeskThingServer.ws &&
      DeskThingServer.ws.readyState === WebSocket.OPEN
    ) {
      DeskThingServer.ws.send("next");
    } else {
      console.error(
        "WebSocket is not open. Cannot send 'next' command.",
        DeskThingServer.ws
      );
    }
  }

  public static previous() {
    if (
      DeskThingServer.ws &&
      DeskThingServer.ws.readyState === WebSocket.OPEN
    ) {
      DeskThingServer.ws.send("previous");
    } else {
      console.error(
        "WebSocket is not open. Cannot send 'previous' command.",
        DeskThingServer.ws
      );
    }
  }
}
