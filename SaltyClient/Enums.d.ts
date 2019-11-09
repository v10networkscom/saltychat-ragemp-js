declare namespace SaltyClient {
    enum Command
    {
        Initiate = 0,
        Ping = 1,
        Pong = 2,
        StateUpdate = 3,
        SelfStateUpdate = 4,
        PlayerStateUpdate = 5,
        RemovePlayer = 6,
        PhoneCommunicationUpdate = 7,
        StopPhoneCommunication = 8,
        RadioTowerUpdate = 9,
        RadioCommunicationUpdate = 10,
        StopRadioCommunication = 11,
        PlaySound = 12,
        StopSound = 13
    }

    enum Error
    {
        OK = 0,
        InvalidJson = 1,
        NotConnectedToServer = 2,
        AlreadyInGame = 3,
        ChannelNotAvailable = 4,
        NameNotAvailable = 5,
        InvalidValue = 6
    }

    enum UpdateBranch
    {
        Stable = 0,
        Testing = 1,
        PreBuild = 2
    }
}
