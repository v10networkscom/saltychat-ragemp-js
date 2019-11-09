class PluginCommand {
    // Props
    public Command: SaltyClient.Command;
    public ServerUniqueIdentifier: string;
    public Parameter: object;

    // CTOR
    constructor(command: SaltyClient.Command, serverIdentifier: string, parameter: object) {
        this.Command = command;
        this.ServerUniqueIdentifier = serverIdentifier;
        this.Parameter = parameter;
    }

    // Helper
    public Serialize() : string {
        return JSON.stringify(this);
    }
}

class GameInstance {
    // Props
    public ServerUniqueIdentifier: string;
    public TeamSpeakName: string;
    public IngameChannel: number;
    public IngameChannelPassword: string;
    public SoundPack: string;

    // CTOR
    constructor(serverIdentifier: string, name: string, channelId: number, channelPassword: string, soundPack: string) {
        this.ServerUniqueIdentifier = serverIdentifier;
        this.TeamSpeakName = name;
        this.IngameChannel = channelId;
        this.IngameChannelPassword = channelPassword;
        this.SoundPack = soundPack;
    }
}
