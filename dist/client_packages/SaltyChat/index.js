var Command;
(function (Command) {
    Command[Command["Initiate"] = 0] = "Initiate";
    Command[Command["Ping"] = 1] = "Ping";
    Command[Command["Pong"] = 2] = "Pong";
    Command[Command["StateUpdate"] = 3] = "StateUpdate";
    Command[Command["SelfStateUpdate"] = 4] = "SelfStateUpdate";
    Command[Command["PlayerStateUpdate"] = 5] = "PlayerStateUpdate";
    Command[Command["RemovePlayer"] = 6] = "RemovePlayer";
    Command[Command["PhoneCommunicationUpdate"] = 7] = "PhoneCommunicationUpdate";
    Command[Command["StopPhoneCommunication"] = 8] = "StopPhoneCommunication";
    Command[Command["RadioTowerUpdate"] = 9] = "RadioTowerUpdate";
    Command[Command["RadioCommunicationUpdate"] = 10] = "RadioCommunicationUpdate";
    Command[Command["StopRadioCommunication"] = 11] = "StopRadioCommunication";
    Command[Command["PlaySound"] = 12] = "PlaySound";
    Command[Command["StopSound"] = 13] = "StopSound";
})(Command || (Command = {}));
var PluginError;
(function (PluginError) {
    PluginError[PluginError["OK"] = 0] = "OK";
    PluginError[PluginError["InvalidJson"] = 1] = "InvalidJson";
    PluginError[PluginError["NotConnectedToServer"] = 2] = "NotConnectedToServer";
    PluginError[PluginError["AlreadyInGame"] = 3] = "AlreadyInGame";
    PluginError[PluginError["ChannelNotAvailable"] = 4] = "ChannelNotAvailable";
    PluginError[PluginError["NameNotAvailable"] = 5] = "NameNotAvailable";
    PluginError[PluginError["InvalidValue"] = 6] = "InvalidValue";
})(PluginError || (PluginError = {}));
var UpdateBranch;
(function (UpdateBranch) {
    UpdateBranch[UpdateBranch["Stable"] = 0] = "Stable";
    UpdateBranch[UpdateBranch["Testing"] = 1] = "Testing";
    UpdateBranch[UpdateBranch["PreBuild"] = 2] = "PreBuild";
})(UpdateBranch || (UpdateBranch = {}));
var RadioType;
(function (RadioType) {
    RadioType[RadioType["None"] = 1] = "None";
    RadioType[RadioType["ShortRange"] = 2] = "ShortRange";
    RadioType[RadioType["LongRange"] = 4] = "LongRange";
    RadioType[RadioType["Distributed"] = 8] = "Distributed";
    RadioType[RadioType["UltraShortRange"] = 16] = "UltraShortRange";
})(RadioType || (RadioType = {}));
class PluginCommand {
    constructor(command, serverIdentifier, parameter) {
        this.Command = command;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.Parameter = parameter;
    }
    Serialize() {
        return JSON.stringify(this);
    }
}
class GameInstance {
    constructor(serverIdentifier, name, channelId, channelPassword, soundPack) {
        this.ServerUniqueIdentifier = serverIdentifier;
        this.Name = name;
        this.ChannelId = channelId;
        this.ChannelPassword = channelPassword;
        this.SoundPack = soundPack;
    }
}
class PlayerState {
    constructor(name, position, rotation, voiceRange, isAlive, volumeOverride) {
        this.Name = name;
        this.Position = position;
        this.Rotation = rotation;
        this.VoiceRange = voiceRange;
        this.IsAlive = isAlive;
        this.VolumeOverride = volumeOverride;
    }
}
class PhoneCommunication {
    constructor(name, signalStrength, volume, direct, relayedBy) {
        this.Name = name;
        this.SignalStrength = signalStrength;
        this.Volume = volume;
        this.Direct = direct;
        this.RelayedBy = relayedBy;
    }
}
class RadioCommunication {
    constructor(name, senderRadioType, ownRadioType, playerMicClick, volume, direct, relayedBy) {
        this.Name = name;
        this.SenderRadioType = senderRadioType;
        this.OwnRadioType = ownRadioType;
        this.PlayMicClick = playerMicClick;
        this.Volume = volume;
        this.Direct = direct;
        this.RelayedBy = relayedBy;
    }
}
class RadioTower {
    constructor(towers) {
        this.Towers = towers;
    }
}
class Sound {
    constructor(filename, isLoop, handle) {
        this.Filename = filename;
        this.IsLoop = isLoop;
        this.Handle = handle;
    }
}
class VoiceClient {
    constructor(player, tsName, voiceRange, isAlive) {
        this.Player = player;
        this.TeamSpeakName = tsName;
        this.VoiceRange = voiceRange;
        this.IsAlive = isAlive;
    }
}
class VoiceManager {
    constructor() {
        this.IsEnabled = false;
        this.ServerUniqueIdentifier = null;
        this.SoundPack = null;
        this.IngameChannel = null;
        this.IngameChannelPassword = null;
        this.TeamSpeakName = null;
        this.VoiceRange = null;
        this.RadioChannel = null;
        this.IsTalking = false;
        this.IsMicrophoneMuted = false;
        this.IsSoundMuted = false;
        this.Cef = null;
        this.IsConnected = false;
        this.IsInGame = false;
        this.NextUpdate = Date.now();
        this.VoiceClients = new Map();
        mp.events.add("SaltyChat_Initialize", (tsName, serverIdentifier, soundPack, ingameChannel, ingameChannelPassword) => this.OnInitialize(tsName, serverIdentifier, soundPack, ingameChannel, ingameChannelPassword));
        mp.events.add("SaltyChat_UpdateClient", (playerHandle, tsName, voiceRange) => this.OnUpdateVoiceClient(playerHandle, tsName, voiceRange));
        mp.events.add("SaltyChat_Disconnected", (playerHandle) => this.OnPlayerDisconnect(playerHandle));
        mp.events.add("SaltyChat_IsTalking", (playerHandle, isTalking) => this.OnPlayerTalking(playerHandle, isTalking));
        mp.events.add("SaltyChat_PlayerDied", (playerHandle) => this.OnPlayerDied(playerHandle));
        mp.events.add("SaltyChat_PlayerRevived", (playerHandle) => this.OnPlayerRevived(playerHandle));
        mp.events.add("SaltyChat_EstablishedCall", (playerHandle) => this.OnEstablishCall(playerHandle));
        mp.events.add("SaltyChat_EstablishedCallRelayed", (playerHandle, direct, relayJson) => this.OnEstablishCallRelayed(playerHandle, direct, relayJson));
        mp.events.add("SaltyChat_EndCall", (playerHandle) => this.OnEndCall(playerHandle));
        mp.events.add("SaltyChat_SetRadioChannel", (radioChannel) => this.OnSetRadioChannel(radioChannel));
        mp.events.add("SaltyChat_IsSending", (playerHandle, isOnRadio) => this.OnPlayerIsSending(playerHandle, isOnRadio));
        mp.events.add("SaltyChat_IsSendingRelayed", (playerHandle, isOnRadio, stateChange, direct, relayJson) => this.OnPlayerIsSendingRelayed(playerHandle, isOnRadio, stateChange, direct, relayJson));
        mp.events.add("SaltyChat_UpdateRadioTowers", (radioTowerJson) => this.OnUpdateRadioTowers(radioTowerJson));
        mp.events.add("SaltyChat_OnConnected", () => this.OnPluginConnected());
        mp.events.add("SaltyChat_OnDisconnected", () => this.OnPluginDisconnected());
        mp.events.add("SaltyChat_OnMessage", (messageJson) => this.OnPluginMessage(messageJson));
        mp.events.add("SaltyChat_OnError", (errorJson) => this.OnPluginError(errorJson));
        mp.events.add("render", () => this.OnTick());
    }
    OnInitialize(tsName, serverIdentifier, soundPack, ingameChannel, ingameChannelPassword) {
        this.TeamSpeakName = tsName;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.SoundPack = soundPack;
        this.IngameChannel = parseInt(ingameChannel);
        this.IngameChannelPassword = ingameChannelPassword;
        this.IsEnabled = true;
        this.Cef = mp.browsers.new("package://SaltyChat/SaltyWebSocket.html");
    }
    OnUpdateVoiceClient(playerHandle, tsName, voiceRange) {
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
    OnPlayerDisconnect(playerHandle) {
        let playerId = parseInt(playerHandle);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            this.ExecuteCommand(new PluginCommand(Command.RemovePlayer, this.ServerUniqueIdentifier, new PlayerState(voiceClient.TeamSpeakName, null, null, null, false, null)));
            this.VoiceClients.delete(playerId);
        }
    }
    OnPlayerTalking(playerHandle, isTalking) {
        let playerId = parseInt(playerHandle);
        let player = mp.players.atRemoteId(playerId);
        if (player == null)
            return;
        if (isTalking)
            player.playFacialAnim("mic_chatter", "mp_facial");
        else
            player.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
    }
    OnPlayerDied(playerHandle) {
        let playerId = parseInt(playerHandle);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            voiceClient.IsAlive = false;
        }
    }
    OnPlayerRevived(playerHandle) {
        let playerId = parseInt(playerHandle);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            voiceClient.IsAlive = true;
        }
    }
    OnEstablishCall(playerHandle) {
        let playerId = parseInt(playerHandle);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            let player = mp.players.atRemoteId(playerId);
            let ownPosition = mp.players.local.position;
            let playerPosition = player.position;
            this.ExecuteCommand(new PluginCommand(Command.PhoneCommunicationUpdate, this.ServerUniqueIdentifier, new PhoneCommunication(voiceClient.TeamSpeakName, mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(ownPosition.x, ownPosition.y, ownPosition.z)) +
                mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(playerPosition.x, playerPosition.y, playerPosition.z)), null, true, null)));
        }
    }
    OnEstablishCallRelayed(playerHandle, direct, relayJson) {
        let playerId = parseInt(playerHandle);
        let relays = JSON.parse(relayJson);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            let player = mp.players.atRemoteId(playerId);
            let ownPosition = mp.players.local.position;
            let playerPosition = player.position;
            this.ExecuteCommand(new PluginCommand(Command.PhoneCommunicationUpdate, this.ServerUniqueIdentifier, new PhoneCommunication(voiceClient.TeamSpeakName, mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(ownPosition.x, ownPosition.y, ownPosition.z)) +
                mp.game.zone.getZoneScumminess(mp.game.zone.getZoneAtCoords(playerPosition.x, playerPosition.y, playerPosition.z)), null, direct, relays)));
        }
    }
    OnEndCall(playerHandle) {
        let playerId = parseInt(playerHandle);
        if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            this.ExecuteCommand(new PluginCommand(Command.StopPhoneCommunication, this.ServerUniqueIdentifier, new PhoneCommunication(voiceClient.TeamSpeakName, null, null, true, null)));
        }
    }
    OnSetRadioChannel(radioChannel) {
        if (typeof radioChannel === "string" && radioChannel != "") {
            this.RadioChannel = radioChannel;
            this.PlaySound("enterRadioChannel", false, "radio");
        }
        else {
            this.RadioChannel = null;
            this.PlaySound("leaveRadioChannel", false, "radio");
        }
    }
    OnPlayerIsSending(playerHandle, isOnRadio) {
        let playerId = parseInt(playerHandle);
        let player = mp.players.atRemoteId(playerId);
        if (player == mp.players.local) {
            this.PlaySound("selfMicClick", false, "MicClick");
        }
        else if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            if (isOnRadio) {
                this.ExecuteCommand(new PluginCommand(Command.RadioCommunicationUpdate, this.ServerUniqueIdentifier, new RadioCommunication(voiceClient.TeamSpeakName, RadioType.LongRange | RadioType.Distributed, RadioType.LongRange | RadioType.Distributed, true, null, true, null)));
            }
            else {
                this.ExecuteCommand(new PluginCommand(Command.StopRadioCommunication, this.ServerUniqueIdentifier, new RadioCommunication(voiceClient.TeamSpeakName, RadioType.None, RadioType.None, true, null, true, null)));
            }
        }
    }
    OnPlayerIsSendingRelayed(playerHandle, isOnRadio, stateChange, direct, relayJson) {
        let playerId = parseInt(playerHandle);
        let relays = JSON.parse(relayJson);
        let player = mp.players.atRemoteId(playerId);
        if (player == mp.players.local) {
            this.PlaySound("selfMicClick", false, "MicClick");
        }
        else if (this.VoiceClients.has(playerId)) {
            let voiceClient = this.VoiceClients.get(playerId);
            if (isOnRadio) {
                this.ExecuteCommand(new PluginCommand(Command.RadioCommunicationUpdate, this.ServerUniqueIdentifier, new RadioCommunication(voiceClient.TeamSpeakName, RadioType.LongRange | RadioType.Distributed, RadioType.LongRange | RadioType.Distributed, stateChange, null, direct, relays)));
            }
            else {
                this.ExecuteCommand(new PluginCommand(Command.StopRadioCommunication, this.ServerUniqueIdentifier, new RadioCommunication(voiceClient.TeamSpeakName, RadioType.None, RadioType.None, stateChange, null, true, null)));
            }
        }
    }
    OnUpdateRadioTowers(radioTowerJson) {
        let radioTowers = JSON.parse(radioTowerJson);
        this.ExecuteCommand(new PluginCommand(Command.RadioTowerUpdate, this.ServerUniqueIdentifier, new RadioTower(radioTowers)));
    }
    OnPluginConnected() {
        this.IsConnected = true;
        this.Initiate();
    }
    OnPluginDisconnected() {
        this.IsConnected = false;
    }
    OnPluginMessage(messageJson) {
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
    OnPluginError(errorJson) {
        try {
            let error = JSON.parse(errorJson);
            if (error.Error == PluginError.AlreadyInGame) {
                this.Initiate();
            }
            else {
                mp.gui.chat.push("[Salty Chat] Error: " + error.Error + " | Message: " + error.Message);
            }
        }
        catch {
            mp.gui.chat.push("[Salty Chat] We got an error, but couldn't deserialize it...");
        }
    }
    OnTick() {
        mp.game.controls.disableControlAction(1, 243, true);
        mp.game.controls.disableControlAction(1, 249, true);
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
    PlaySound(fileName, loop, handle) {
        this.ExecuteCommand(new PluginCommand(Command.PlaySound, this.ServerUniqueIdentifier, new Sound(fileName, loop, handle)));
    }
    StopSound(handle) {
        this.ExecuteCommand(new PluginCommand(Command.StopSound, this.ServerUniqueIdentifier, new Sound(handle, false, handle)));
    }
    Initiate() {
        this.ExecuteCommand(new PluginCommand(Command.Initiate, this.ServerUniqueIdentifier, new GameInstance(this.ServerUniqueIdentifier, this.TeamSpeakName, this.IngameChannel, this.IngameChannelPassword, this.SoundPack)));
    }
    PlayerStateUpdate() {
        let playerPosition = mp.players.local.position;
        this.VoiceClients.forEach((voiceClient, playerId) => {
            let nPlayerPosition = voiceClient.Player.position;
            this.ExecuteCommand(new PluginCommand(Command.PlayerStateUpdate, this.ServerUniqueIdentifier, new PlayerState(voiceClient.TeamSpeakName, nPlayerPosition, null, voiceClient.VoiceRange, voiceClient.IsAlive, null)));
        });
        this.ExecuteCommand(new PluginCommand(Command.SelfStateUpdate, this.ServerUniqueIdentifier, new PlayerState(null, playerPosition, mp.game.cam.getGameplayCamRot(0).z, null, false, null)));
    }
    ToggleVoiceRange() {
        let index = VoiceManager.VoiceRanges.indexOf(this.VoiceRange);
        if (index < 0)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[1]);
        else if (index + 1 >= VoiceManager.VoiceRanges.length)
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[0]);
        else
            mp.events.callRemote("SaltyChat_SetVoiceRange", VoiceManager.VoiceRanges[index + 1]);
    }
    ExecuteCommand(command) {
        if (this.IsEnabled && this.IsConnected) {
            this.Cef.execute("runCommand('" + JSON.stringify(command) + "')");
        }
    }
}
VoiceManager.VoiceRanges = [3.0, 8.0, 15.0, 32.0];
let voiceManager = new VoiceManager();
