/// <reference path="Enums.ts" />

//#region PluginCommand
class PluginCommand {
    // Props
    public Command: Command;
    public ServerUniqueIdentifier: string;
    public Parameter: object;

    // CTOR
    constructor(command: Command, serverIdentifier: string, parameter: object) {
        this.Command = command;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.Parameter = parameter;
    }

    // Helper
    public Serialize() : string {
        return JSON.stringify(this);
    }
}
//#endregion PluginCommand

//#region GameInstance
class GameInstance {
    // Props
    public ServerUniqueIdentifier: string;
    public Name: string;
    public ChannelId: number;
    public ChannelPassword: string;
    public SoundPack: string;

    // CTOR
    constructor(serverIdentifier: string, name: string, channelId: number, channelPassword: string, soundPack: string) {
        this.ServerUniqueIdentifier = serverIdentifier;
        this.Name = name;
        this.ChannelId = channelId;
        this.ChannelPassword = channelPassword;
        this.SoundPack = soundPack;
    }
}
//#endregion GameInstance

//#region PlayerState
class PlayerState {
    // Props
    public Name: string;
    public Position: Vector3Mp;
    public Rotation: number;
    public VoiceRange: number;
    public IsAlive: boolean;
    public VolumeOverride: number;

    // CTOR
    constructor(name: string, position: Vector3Mp, rotation: number, voiceRange: number, isAlive: boolean, volumeOverride: number) {
        this.Name = name;
        this.Position = position;
        this.Rotation = rotation;
        this.VoiceRange = voiceRange;
        this.IsAlive = isAlive;
        this.VolumeOverride = volumeOverride;
    }
}
//#endregion PlayerState

//#region PhoneCommunication
class PhoneCommunication {
    // Props
    public Name: string;
    public SignalStrength: number;
    public Volume: number;

    public Direct: boolean;
    public RelayedBy: string[];

    // CTOR
    constructor(name: string, signalStrength: number, volume: number, direct: boolean, relayedBy: string[]) {
        this.Name = name;
        this.SignalStrength = signalStrength;
        this.Volume = volume;

        this.Direct = direct;
        this.RelayedBy = relayedBy;
    }
}
//#endregion PhoneCommunication

//#region RadioCommunication
class RadioCommunication {
    // Props
    public Name: string;
    public SenderRadioType: RadioType;
    public OwnRadioType: RadioType;
    public PlayMicClick: boolean;
    public Volume: number;

    public Direct: boolean;
    public RelayedBy: string[];

    // CTOR
    constructor(name: string, senderRadioType: RadioType, ownRadioType: RadioType, playerMicClick: boolean, volume: number, direct: boolean, relayedBy: string[]) {
        this.Name = name;
        this.SenderRadioType = senderRadioType;
        this.OwnRadioType = ownRadioType;
        this.PlayMicClick = playerMicClick;
        this.Volume = volume;

        this.Direct = direct;
        this.RelayedBy = relayedBy;
    }
}
//#endregion RadioCommunication

//#region RadioTower
class RadioTower {
    // Props
    public Towers: Vector3Mp[];

    // CTOR
    constructor(towers: Vector3Mp[]) {
        this.Towers = towers;
    }
}
//#endregion RadioTower

//#region Sound
class Sound {
    // Props
    public Filename: string;
    public IsLoop: boolean;
    public Handle: string;

    // CTOR
    constructor(filename: string, isLoop: boolean, handle: string) {
        this.Filename = filename;
        this.IsLoop = isLoop;
        this.Handle = handle;
    }
}
//#endregion Sound

//#region VoiceClient
class VoiceClient {
    // Props
    public Player: PlayerMp;
    public TeamSpeakName: string;
    public VoiceRange: number;
    public IsAlive: boolean;

    // CTOR
    constructor(player: PlayerMp, tsName: string, voiceRange: number, isAlive: boolean) {
        this.Player = player;
        this.TeamSpeakName = tsName;
        this.VoiceRange = voiceRange;
        this.IsAlive = isAlive;
    }
}
//#endregion VoiceClient
