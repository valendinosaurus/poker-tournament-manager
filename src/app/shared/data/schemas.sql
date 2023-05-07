CREATE TABLE Tournament (
  id INTEGER PRIMARY KEY;
  name VARCHAR(200) NOT NULL;
  date DATETIME NOT  NULL;
  amountBuyIn INTEGER NOT NULL;
  numberOfRebuys INTEGER NOT NULL;
  amountRebuy INTEGER NOT NULL;
  numberOfAddons INTEGER NOT NULL;
  amountAddon INTEGER NOT NULL;
);

CREATE TABLE Player (
  id INTEGER PRIMARY KEY;
  name VARCHAR(200);
);

CREATE TABLE PlayerInTournamnet (
  playerId INTEGER NOT NULL;
  tournamentId INTEGER NOT NULL;
  finished INTEGER NOT NULL;
  amountWon INTEGER NOT NULL;
  FOREIGN KEY (playerId) REFERENCES Player(id);
  FOREIGN KEY (tournamentId) REFERENCES Tournament(id);
);

