/// <reference path="Enums.ts" />
/// <reference path="Models.ts" />

//#region VoiceManager
class VoiceManager {
    //#region Props
    public IsEnabled: boolean = false;

    public ServerUniqueIdentifier: string = null;
    public SoundPack: string = null;
    public IngameChannel: number = null;
    public IngameChannelPassword: string = null;
    public TeamSpeakName: string = null;
    public VoiceRange: number = null;
    public RadioChannel: string = null;

    public IsTalking: boolean = false;
    public IsMicrophoneMuted: boolean = false;
    public IsSoundMuted: boolean = false;

    private Cef: BrowserMp = null;
    private IsConnected: boolean = false;
    private IsInGame: boolean = false;
    private NextUpdate: number = Date.now();

    private VoiceClients = new Map();

    static readonly VoiceRanges: number[] = [3.0, 8.0, 15.0, 32.0];
    //#endregion Props

    //#region CTOR
    constructor() {
        // Basic Handling
        mp.events.add("SaltyChat_Initialize", (tsName: string, serverIdentifier: string, soundPack: string, ingameChannel: string, ingameChannelPassword: string) => this.OnInitialize(tsName, serverIdentifier, soundPack, ingameChannel, ingameChannelPassword));
        mp.events.add("SaltyChat_UpdateClient", (playerHandle: string, tsName: string, voiceRange: number) => this.OnUpdateVoiceClient(playerHandle, tsName, voiceRange));
        mp.events.add("SaltyChat_Disconnected", (playerHandle: string) => this.OnPlayerDisconnect(playerHandle));
        mp.events.add("SaltyChat_IsTalking", (playerHandle: string, isTalking: boolean) => this.OnPlayerTalking(playerHandle, isTalking));
        mp.events.add("SaltyChat_PlayerDied", (playerHandle: string) => this.OnPlayerDied(playerHandle));
        mp.events.add("SaltyChat_PlayerRevived", (playerHandle: string) => this.OnPlayerRevived(playerHandle));

        // Phone Handling
        mp.events.add("SaltyChat_EstablishedCall", (playerHandle: string) => this.OnEstablishCall(playerHandle));
        mp.events.add("SaltyChat_EstablishedCallRelayed", (playerHandle: string, direct: boolean, relayJson: string) => this.OnEstablishCallRelayed(playerHandle, direct, relayJson));
        mp.events.add("SaltyChat_EndCall", (playerHandle: string) => this.OnEndCall(playerHandle));

        // Radio Handling
        mp.events.add("SaltyChat_SetRadioChannel", (radioChannel: string) => this.OnSetRadioChannel(radioChannel));
        mp.events.add("SaltyChat_IsSending", (playerHandle: string, channelName: string, isOnRadio: boolean, stateChanged: boolean, position: Vector3Mp) => this.OnPlayerIsSending(playerHandle, channelName, isOnRadio, stateChanged, position));
        mp.events.add("SaltyChat_IsSendingRelayed", (playerHandle: string, isOnRadio: boolean, stateChange: boolean, direct: boolean, relayJson: string) => this.OnPlayerIsSendingRelayed(playerHandle, isOnRadio, stateChange, direct, relayJson));
        mp.events.add("SaltyChat_UpdateRadioTowers", (radioTowerJson: string) => this.OnUpdateRadioTowers(radioTowerJson));

        // Plugin Handling
        mp.events.add("SaltyChat_OnConnected", () => this.OnPluginConnected());
        mp.events.add("SaltyChat_OnDisconnected", () => this.OnPluginDisconnected());
        mp.events.add("SaltyChat_OnMessage", (messageJson: string) => this.OnPluginMessage(messageJson));
        mp.events.add("SaltyChat_OnError", (errorJson: string) => this.OnPluginError(errorJson));

        // Render / on tick
        mp.events.add("render", () => this.OnTick());
    }
    //#endregion CTOR

    //#region Remote Events (Basic Handling)
    private OnInitialize(tsName: string, serverIdentifier: string, soundPack: string, ingameChannel: string, ingameChannelPassword: string): void {
        this.TeamSpeakName = tsName;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.SoundPack = soundPack;
        this.IngameChannel = parseInt(ingameChannel);
        this.IngameChannelPassword = ingameChannelPassword;

        this.IsEnabled = true;
        this.Cef = mp.browsers.new("package://SaltyChat/SaltyWebSocket.html");
        this.Cef.active = false;
    }

    private OnUpdateVoiceClient(playerHandle: string, tsName: string, voiceRange: number): void {
        let playerId: number = parseInt(playerHandle);

        let player: PlayerMp = mp.players.atRemoteId(playerId);

        if (player == null)
            return;

        if (player == mp.players.local) {
            this.VoiceRange = voiceRange;

            mp.gui.chat.push("[Salty Chat] Voice Range: " + this.VoiceRange + "m");
        }
        else {
            if (this.VoiceClients.has(playerId)) {
                let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

                voiceClient.TeamSpeakName = tsName;
                voiceClient.VoiceRange = voiceRange;
            }
            else {
                this.VoiceClients.set(playerId, new VoiceClient(player, tsName, voiceRange, true));
            }
        }
    }

    private OnPlayerDisconnect(playerHandle: string): void {
        let playerId: number = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            this.ExecuteCommand(
                new PluginCommand(
                    Command.RemovePlayer,
                    this.ServerUniqueIdentifier,
                    new PlayerState(
                        voiceClient.TeamSpeakName,
                        null,
                        null,
                        null,
                        false,
                        null
                    )
                )
            );

            this.VoiceClients.delete(playerId);
        }
    }

    private OnPlayerTalking(playerHandle: string, isTalking: boolean): void {
        let playerId: number = parseInt(playerHandle);

        let player: PlayerMp = mp.players.atRemoteId(playerId);

        if (player == null)
            return;

        if (isTalking)
            player.playFacialAnim("mic_chatter", "mp_facial");
        else
            player.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
    }

    private OnPlayerDied(playerHandle: string): void {
        let playerId: number = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            voiceClient.IsAlive = false;
        }
    }

    private OnPlayerRevived(playerHandle: string): void {
        let playerId: number = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            voiceClient.IsAlive = true;
        }
    }
    //#endregion Remote Events (Basic Handling)

    //#region Remote Events (Phone Handling)
    private OnEstablishCall(playerHandle: string): void {
        let playerId: number = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            let player: PlayerMp = mp.players.atRemoteId(playerId);

            let ownPosition: Vector3Mp = mp.players.local.position;
            let playerPosition: Vector3Mp = player.position;

            this.ExecuteCommand(
                new PluginCommand(
                    Command.PhoneCommunicationUpdate,
                    this.ServerUniqueIdentifier,
                    new PhoneCommunication(
                        voiceClient.TeamSpeakName,
                        mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(ownPosition.x, ownPosition.y, ownPosition.z)) +
                        mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(playerPosition.x, playerPosition.y, playerPosition.z)),
                        null,
                        true,
                        null
                    )
                )
            )
        }
    }

    private OnEstablishCallRelayed(playerHandle: string, direct: boolean, relayJson: string): void {
        let playerId: number = parseInt(playerHandle);
        let relays: string[] = JSON.parse(relayJson);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            let player: PlayerMp = mp.players.atRemoteId(playerId);

            let ownPosition: Vector3Mp = mp.players.local.position;
            let playerPosition: Vector3Mp = player.position;

            this.ExecuteCommand(
                new PluginCommand(
                    Command.PhoneCommunicationUpdate,
                    this.ServerUniqueIdentifier,
                    new PhoneCommunication(
                        voiceClient.TeamSpeakName,
                        mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(ownPosition.x, ownPosition.y, ownPosition.z)) +
                        mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(playerPosition.x, playerPosition.y, playerPosition.z)),
                        null,
                        direct,
                        relays
                    )
                )
            )
        }
    }

    private OnEndCall(playerHandle: string): void {
        let playerId: number = parseInt(playerHandle);

        if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            this.ExecuteCommand(
                new PluginCommand(
                    Command.StopPhoneCommunication,
                    this.ServerUniqueIdentifier,
                    new PhoneCommunication(
                        voiceClient.TeamSpeakName,
                        null,
                        null,
                        true,
                        null
                    )
                )
            )
        }
    }
    //#endregion Remote Events (Phone Handling)

    //#region Remote Events (Radio Handling)
    private OnSetRadioChannel(radioChannel: string): void {
        if (typeof radioChannel === "string" && radioChannel != "") {
            this.RadioChannel = radioChannel;
            this.PlaySound("enterRadioChannel", false, "radio")
        }
        else {
            this.RadioChannel = null;
            this.PlaySound("leaveRadioChannel", false, "radio")
        }
    }

    private OnPlayerIsSending(playerHandle: string, channelName: string, isOnRadio: boolean, stateChanged: boolean, position: Vector3Mp): void {
        let playerId: number = parseInt(playerHandle);

        let player: PlayerMp = mp.players.atRemoteId(playerId);

        if (player == mp.players.local) {
            this.PlaySound("selfMicClick", false, "MicClick");
        }
        else if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            if (isOnRadio) {
                this.ExecuteCommand(
                    new PluginCommand(
                        Command.PlayerStateUpdate,
                        this.ServerUniqueIdentifier,
                        new PlayerState(
                            voiceClient.TeamSpeakName,
                            position,
                            null,
                            voiceClient.VoiceRange,
                            voiceClient.IsAlive,
                            null
                        )
                    )
                );
                this.ExecuteCommand(
                    new PluginCommand(
                        Command.RadioCommunicationUpdate,
                        this.ServerUniqueIdentifier,
                        new RadioCommunication(
                            voiceClient.TeamSpeakName,
                            RadioType.LongRange | RadioType.Distributed,
                            RadioType.LongRange | RadioType.Distributed,
                            true,
                            null,
                            true,
                            null
                        )
                    )
                );
            }
            else {
                this.ExecuteCommand(
                    new PluginCommand(
                        Command.StopRadioCommunication,
                        this.ServerUniqueIdentifier,
                        new RadioCommunication(
                            voiceClient.TeamSpeakName,
                            RadioType.None,
                            RadioType.None,
                            true,
                            null,
                            true,
                            null
                        )
                    )
                );
            }
        }
    }

    private OnPlayerIsSendingRelayed(playerHandle: string, isOnRadio: boolean, stateChange: boolean, direct: boolean, relayJson: string): void {
        let playerId: number = parseInt(playerHandle);
        let relays: string[] = JSON.parse(relayJson);

        let player: PlayerMp = mp.players.atRemoteId(playerId);

        if (player == mp.players.local) {
            this.PlaySound("selfMicClick", false, "MicClick");
        }
        else if (this.VoiceClients.has(playerId)) {
            let voiceClient: VoiceClient = this.VoiceClients.get(playerId);

            if (isOnRadio) {
                this.ExecuteCommand(
                    new PluginCommand(
                        Command.RadioCommunicationUpdate,
                        this.ServerUniqueIdentifier,
                        new RadioCommunication(
                            voiceClient.TeamSpeakName,
                            RadioType.LongRange | RadioType.Distributed,
                            RadioType.LongRange | RadioType.Distributed,
                            stateChange,
                            null,
                            direct,
                            relays
                        )
                    )
                );
            }
            else {
                this.ExecuteCommand(
                    new PluginCommand(
                        Command.StopRadioCommunication,
                        this.ServerUniqueIdentifier,
                        new RadioCommunication(
                            voiceClient.TeamSpeakName,
                            RadioType.None,
                            RadioType.None,
                            stateChange,
                            null,
                            true,
                            null
                        )
                    )
                );
            }
        }
    }

    private OnUpdateRadioTowers(radioTowerJson: string): void {
        let radioTowers: Vector3Mp[] = JSON.parse(radioTowerJson);

        this.ExecuteCommand(
            new PluginCommand(
                Command.RadioTowerUpdate,
                this.ServerUniqueIdentifier,
                new RadioTower(
                    radioTowers
                )
            )
        );
    }
    //#endregion Remote Events (Radio Handling)

    //#region Plugin Events
    private OnPluginConnected(): void {
        this.IsConnected = true;

        this.Initiate();
    }

    private OnPluginDisconnected(): void {
        this.IsConnected = false;
    }

    private OnPluginMessage(messageJson: string): void {
        let message = JSON.parse(messageJson);

        if (message.ServerUniqueIdentifier != this.ServerUniqueIdentifier)
            return;

        if (message.Command == Command.Ping && this.NextUpdate + 1000 > Date.now()) {
            this.ExecuteCommand(new PluginCommand(Command.Pong, this.ServerUniqueIdentifier, null));
            return;
        }

        if (message.Parameter === typeof ('undefined') || message.Parameter == null)
            return;

        let parameter = message.Parameter;

        if (parameter.IsReady && !this.IsInGame) {
            mp.events.callRemote("SaltyChat_CheckVersion", parameter.UpdateBranch, parameter.Version);

            this.IsInGame = parameter.IsReady;
        }

        if (parameter.IsTalking != this.IsTalking) {
            this.IsTalking = parameter.IsTalking;

            mp.events.callRemote("SaltyChat_IsTalking", this.IsTalking);
        }

        if (parameter.IsMicrophoneMuted != this.IsMicrophoneMuted) {
            this.IsMicrophoneMuted = parameter.IsMicrophoneMuted;
        }

        if (parameter.IsSoundMuted != this.IsSoundMuted) {
            this.IsSoundMuted = parameter.IsSoundMuted;
        }
    }

    private OnPluginError(errorJson: string): void {
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
    //#endregion Plugin Events

    //#region Tick
    private OnTick(): void {
        mp.game.controls.disableControlAction(1, 243, true); // disable ^ - voice range
        mp.game.controls.disableControlAction(1, 249, true); // disable N - radio

        if (this.IsConnected && this.IsInGame && Date.now() > this.NextUpdate) {
            this.PlayerStateUpdate();

            this.NextUpdate = Date.now() + 300;
        }

        if (this.RadioChannel != null) {
            if (mp.game.controls.isDisabledControlJustPressed(1, 249))
                mp.events.callRemote("SaltyChat_IsSending", this.RadioChannel, true);
            else if (mp.game.controls.isDisabledControlJustReleased(1, 249))
                mp.events.callRemote("SaltyChat_IsSending", this.RadioChannel, false);
        }

        if (mp.game.controls.isDisabledControlJustPressed(0, 243)) {
            this.ToggleVoiceRange();
        }
    }
    //#endregion Tick

    //#region Sound
    public PlaySound(fileName: string, loop: boolean, handle: string) {
        this.ExecuteCommand(
            new PluginCommand(
                Command.PlaySound,
                this.ServerUniqueIdentifier,
                new Sound(
                    fileName,
                    loop,
                    handle
                )
            )
        );
    }

    public StopSound(handle: string) {
        this.ExecuteCommand(
            new PluginCommand(
                Command.StopSound,
                this.ServerUniqueIdentifier,
                new Sound(
                    handle,
                    false,
                    handle
                )
            )
        );
    }
    //#endregion Sound

    //#region Helper
    private Initiate(): void {
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

    private PlayerStateUpdate(): void {
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

    private ToggleVoiceRange(): void {
        let index: number = VoiceManager.VoiceRanges.indexOf(this.VoiceRange);

        if (index < 0)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[1]);
        else if (index + 1 >= VoiceManager.VoiceRanges.length)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[0]);
        else
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[index + 1]);
    }

    private ExecuteCommand(command: PluginCommand): void {
        if (this.IsEnabled && this.IsConnected) {
            this.Cef.execute("runCommand('" + JSON.stringify(command) + "')");
        }
    }
    //#endregion Helper
}
//#endregion VoiceManager

let voiceManager: VoiceManager = new VoiceManager();
