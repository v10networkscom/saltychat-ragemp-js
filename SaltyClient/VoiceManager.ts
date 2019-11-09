/// <reference path="Enums.ts" />
/// <reference path="Models.ts" />

class VoiceManager {
    // Props
    public IsEnabled: boolean = false;

    public ServerUniqueIdentifier: string = null;
    public SoundPack: string = null;
    public IngameChannel: number = null;
    public IngameChannelPassword: string = null;
    public TeamSpeakName: string = null;
    public VoiceRange: number = null;

    public IsTalking: boolean = false;
    public IsMicrophoneMuted: boolean = false;
    public IsSoundMuted: boolean = false;

    private Cef: BrowserMp = null;
    private IsConnected: boolean = false;
    private IsInGame: boolean = false;
    private NextUpdate: number = Date.now();

    private VoiceClients = new Map();

    static readonly VoiceRanges: number[] = [ 3.0, 8.0, 15.0, 32.0 ];

    // CTOR
    constructor() {
        mp.events.add("SaltyChat_Initialize", (tsName: string, serverIdentifier: string, soundPack: string, ingameChannel: string, ingameChannelPassword: string) => this.OnInitialize(tsName, serverIdentifier, soundPack, ingameChannel, ingameChannelPassword));
        mp.events.add("SaltyChat_UpdateClient", (playerHandle: string, tsName: string, voiceRange: number) => this.OnUpdateVoiceClient(playerHandle, tsName, voiceRange));
        mp.events.add("SaltyChat_Disconnected", (playerHandle: string) => this.OnPlayerDisconnect(playerHandle));

        mp.events.add("SaltyChat_IsTalking", (playerHandle: string, isTalking: boolean) => this.OnPlayerTalking(playerHandle, isTalking));
        mp.events.add("SaltyChat_PlayerDied", (playerHandle: string) => this.OnPlayerDied(playerHandle));
        mp.events.add("SaltyChat_PlayerRevived", (playerHandle: string) => this.OnPlayerRevived(playerHandle));

        mp.events.add("SaltyChat_OnConnected", () => this.OnPluginConnected());
        mp.events.add("SaltyChat_OnDisconnected", () => this.OnPluginDisconnected());
        mp.events.add("SaltyChat_OnMessage", (messageJson: string) => this.OnPluginMessage(messageJson));
        mp.events.add("SaltyChat_OnError", (errorJson: string) => this.OnPluginError(errorJson));
        
        mp.events.add("render", () => this.OnTick());
    }

    // Remote Events
    private OnInitialize(tsName: string, serverIdentifier: string, soundPack: string, ingameChannel: string, ingameChannelPassword: string) {
        this.TeamSpeakName = tsName;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.SoundPack = soundPack;
        this.IngameChannel = parseInt(ingameChannel);
        this.IngameChannelPassword = ingameChannelPassword;

        this.IsEnabled = true;
        this.Cef = mp.browsers.new("package://Voice/SaltyWebSocket.html");
    }
    
    private OnUpdateVoiceClient(playerHandle: string, tsName: string, voiceRange: number) {
        let playerId = parseInt(playerHandle);

        let player = mp.players.atRemoteId(playerId);

        if (player == null)
            return;

        if (player == mp.players.local) {
            this.VoiceRange = voiceRange;

            mp.gui.chat.push("[Salty Chat] Voice Range: " + this.VoiceRange + "m");
        }
        else {
            if (this.VoiceClients.has(playerId)) {
                let voiceClient = this.VoiceClients.get(playerId);

                voiceClient.TeamSpeakName = tsName;
                voiceClient.VoiceRange = voiceRange;
            }
            else {
                this.VoiceClients.set(playerId, new VoiceClient(player, tsName, voiceRange, true));
            }
        }
    }
    
    private OnPlayerDisconnect(playerHandle: string) {
        let playerId = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            this.VoiceClients.delete(playerId);
        }
    }
    
    private OnPlayerTalking(playerHandle: string, isTalking: boolean) {
        let playerId = parseInt(playerHandle);

        let player = mp.players.atRemoteId(playerId);

        if (player == null)
            return;

        if (isTalking)
            player.playFacialAnim("mic_chatter", "mp_facial");
        else
            player.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
    }
    
    private OnPlayerDied(playerHandle: string) {
        let playerId = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);

            voiceClient.IsAlive = false;
        }
    }
    
    private OnPlayerRevived(playerHandle: string) {
        let playerId = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);

            voiceClient.IsAlive = true;
        }
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

        if (message.ServerUniqueIdentifier != this.ServerUniqueIdentifier)
            return;

        if (message.Command == Command.Ping && this.NextUpdate + 1000 > Date.now()) {
            this.ExecuteCommand(new PluginCommand(Command.Pong, this.ServerUniqueIdentifier, null));
            return;
        }

        if (message.Parameter === typeof('undefined') || message.Parameter == null)
            return;

        let parameter = message.Parameter;

        if (parameter.IsReady && !this.IsInGame) {
            mp.events.callRemote("SaltyChat_CheckVersion", parameter.UpdateBranch, parameter.Version);

            this.IsInGame = parameter.IsReady;
        }

        if (parameter.IsTalking != this.IsTalking)
        {
            this.IsTalking = parameter.IsTalking;

            mp.events.callRemote("SaltyChat_IsTalking", this.IsTalking);
        }

        if (parameter.IsMicrophoneMuted != this.IsMicrophoneMuted)
        {
            this.IsMicrophoneMuted = parameter.IsMicrophoneMuted;
        }

        if (parameter.IsSoundMuted != this.IsSoundMuted)
        {
            this.IsSoundMuted = parameter.IsSoundMuted;
        }
    }

    private OnPluginError(errorJson: string) {
        try {
            let error = JSON.parse(errorJson);

            if (error.Error == PluginError.AlreadyInGame) {
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

    // Tick
    private OnTick() {
        mp.game.controls.disableControlAction(1, 243, true); // disable ^ - voice range
        mp.game.controls.disableControlAction(1, 249, true); // disable N - radio

        if (this.IsConnected && this.IsInGame && Date.now() > this.NextUpdate) {
            this.PlayerStateUpdate();

            this.NextUpdate = Date.now() + 300;
        }

        if (mp.game.controls.isDisabledControlJustPressed(0, 243)) {
            this.ToggleVoiceRange();
        }
    }

    // Helper
    private Initiate() {
        this.ExecuteCommand(
            new PluginCommand(
                Command.Initiate,
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

    private PlayerStateUpdate() {
        let playerPosition: Vector3Mp = mp.players.local.position;

        this.VoiceClients.forEach((voiceClient: VoiceClient, playerId: number) => {
            let nPlayerPosition: Vector3Mp = voiceClient.Player.position;

            this.ExecuteCommand(
                new PluginCommand(
                    Command.PlayerStateUpdate,
                    this.ServerUniqueIdentifier,
                    new PlayerState(
                        voiceClient.TeamSpeakName,
                        nPlayerPosition,
                        null,
                        voiceClient.VoiceRange,
                        voiceClient.IsAlive,
                        null
                    )
                )
            );
        });

        this.ExecuteCommand(
            new PluginCommand(
                Command.SelfStateUpdate,
                this.ServerUniqueIdentifier,
                new PlayerState(
                    null,
                    playerPosition,
                    mp.game.cam.getGameplayCamRot(0).z,
                    null,
                    false,
                    null
                )
            )
        );
    }

    private ToggleVoiceRange() {
        let index = VoiceManager.VoiceRanges.indexOf(this.VoiceRange);

        if (index < 0)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[1]);
        else if (index + 1 >= VoiceManager.VoiceRanges.length)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[0]);
        else
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[index + 1]);
    }

    private ExecuteCommand(command: PluginCommand) {
        if (this.IsEnabled && this.IsConnected) {
            this.Cef.execute("runCommand('" + JSON.stringify(command) + "')");
        }
    }
}

let voiceManager = new VoiceManager();
