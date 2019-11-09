class VoiceManager {
    // Props
    public IsEnabled: boolean;

    public ServerUniqueIdentifier: string;
    public SoundPack: string;
    public IngameChannel: number;
    public IngameChannelPassword: string;
    public TeamSpeakName: string;
    public VoiceRange: number;

    public IsTalking: boolean;
    public IsMicrophoneMuted: boolean;
    public IsSoundMuted: boolean;

    private Cef: BrowserMp;
    private IsConnected: boolean;
    private IsInGame: boolean;
    private NextUpdate: number;

    private VoiceClients: object[];

    // CTOR
    constructor() {
        mp.events.add("SaltyChat_Initialize", this.OnInitialize);

        mp.events.add("SaltyChat_OnConnected", this.OnPluginConnected);
        mp.events.add("SaltyChat_OnDisconnected", this.OnPluginDisconnected);
        mp.events.add("SaltyChat_OnMessage", this.OnPluginMessage);
        mp.events.add("SaltyChat_OnError", this.OnPluginError);
    }

    // Remote Events
    private OnInitialize(tsName: string, serverIdentifier: string, soundPack: string, ingameChannel: number, ingameChannelPassword: string) {
        this.TeamSpeakName = tsName;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.SoundPack = soundPack;
        this.IngameChannel = ingameChannel;
        this.IngameChannelPassword = ingameChannelPassword;

        this.IsEnabled = true;
        this.NextUpdate = Date.now();
        this.Cef = mp.browsers.new("package://Voice/SaltyWebSocket.html");
    }

    // Plugin Events
    private OnPluginConnected() {
        this.IsConnected = true;

        this.Initiate();
    }

    private OnPluginDisconnected() {
        this.IsConnected = false;
    }

    private OnPluginMessage(messageJson: string) {
        let message = JSON.parse(messageJson);

        if (message.Command == SaltyClient.Command.Ping && this.NextUpdate + 1000 > Date.now()) {
            this.ExecuteCommand(new PluginCommand(SaltyClient.Command.Pong, this.ServerUniqueIdentifier, null));
            return;
        }

        if (message.IsReady && !this.IsInGame) {
            mp.events.callRemote("SaltyChat_CheckVersion", message.UpdateBranch, message.Version);

            this.IsInGame = message.IsReady;
        }

        if (message.IsTalking != this.IsTalking)
        {
            this.IsTalking = message.IsTalking;

            mp.events.callRemote("SaltyChat_IsTalking", this.IsTalking);
        }

        if (message.IsMicrophoneMuted != this.IsMicrophoneMuted)
        {
            this.IsMicrophoneMuted = message.IsMicrophoneMuted;
        }

        if (message.IsSoundMuted != this.IsSoundMuted)
        {
            this.IsSoundMuted = message.IsSoundMuted;
        }
    }

    private OnPluginError(errorJson: string) {
        try {
            let error = JSON.parse(errorJson);

            if (error.Error == SaltyClient.Error.AlreadyInGame) {
                this.Initiate(); // try again an hope that the game instance was reset on plugin side
            }
            else {
                mp.gui.chat.push("[Salty Chat] Error: " + error.Error + " | Message: " + error.Message);
            }
        }
        catch {
            mp.gui.chat.push("[Salty Chat] We got an error, but couldn't deserialize it...");
        }
    }

    // Helper
    private Initiate() {
        this.ExecuteCommand(
            new PluginCommand(
                SaltyClient.Command.Initiate,
                this.ServerUniqueIdentifier,
                new GameInstance(
                    this.ServerUniqueIdentifier,
                    this.TeamSpeakName,
                    this.IngameChannel,
                    this.IngameChannelPassword,
                    this.SoundPack
                )
            )
        );
    }

    private ExecuteCommand(command: PluginCommand) {
        if (this.IsEnabled && this.IsConnected) {
            this.Cef.execute("runCommand('" + JSON.stringify(command) + "')");
        }
    }
}
