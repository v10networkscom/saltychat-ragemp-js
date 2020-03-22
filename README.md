# Salty Chat for [RAGEMP](https://rage.mp/)
An example implementation of Salty Chat for [RAGEMP](https://rage.mp/).

You can report bugs or make sugguestions via issues, or contribute via pull requests - we appreciate any contribution.

Join our [Discord](https://discord.gg/MBCnqSf) and start with [Salty Chat](https://www.saltmine.de/)!

# Setup Steps
2. Copy the contents of the `dist`-folder into your `server-files`-folder
2. Edit the ``server-files/packages/SaltyChat/index.js`` and fill in server UID, Sound Pack and Ingame Channel ID (password is optional)

### Optional

If you want your players to join the in-game channel manually, comment out the following line `mp.events.add("playerJoin", playerJoinHandler);` in `server-files/packages/SaltyChat/index.js` .

# Callable Events

**PlayerJoin:** `mp.events.call("salty:joinVoice", player: PlayerMp, teamSpeakName: string);`

**SetRadioSpeaker:** `mp.events.call("salty:setRadioSpeaker", player: PlayerMp, toggle: boolean);`

**JoinRadioChannel:** `mp.events.call("salty:joinRadioChannel", player: PlayerMp, radioChannelName: string);`

**LeaveAllRadioChannel:** `mp.events.call("salty:leaveAllRadioChannel", player: PlayerMp);`

**LeaveRadioChannel:** `mp.events.call("salty:leaveRadioChannel", player: PlayerMp);`

**StartPhoneCall:** `mp.events.call("salty:startPhoneCall", player1: PlayerMp, player2: PlayerMp);`

**EndPhoneCall:** `mp.events.call("salty:endPhoneCall", player1: PlayerMp, player2: PlayerMp);`

**PlayerDeath:** `mp.events.call("salty:playerDeath", player: PlayerMp);`

**PlayerRevive:** `mp.events.call("salty:playerRevived", player: PlayerMp);`