import { config } from "./config.js";
import { GetFakeMatches } from "./utils/fakematch.js";
import axios from "axios";

console.log("API used: " + config.api);
const randomPause = Math.floor(Math.random() * 750) + 1000;
const _playerName = "bio";
const _ItCountryCode = "IT";
const _AbleQueryGetMatchResult = true; //per non spammare query
const _playersTracked = config.trackedPlayers;
// Ottieni la data di oggi
const today = new Date();
// // Sottrai 30 giorni
const pastDate = new Date();
pastDate.setDate(today.getDate() - 30);
const PastDateFormated = pastDate.toISOString().split("T")[0];
const TodayteFormated = today.toISOString().split("T")[0];
// let matches = GetFakeMatches();

// if (_AbleQueryGetMatchResult) matches = await GetPlayerMatches(_playerName);
console.log("data di partenza:" + PastDateFormated);
console.log("fino" + TodayteFormated);

for (let i = 0; i < _playersTracked.length; i++) {
  const r = await GetPlayerRank(_playersTracked[i]);
  console.log(_playersTracked[i], r);
}

async function GetPlayerRank(playerName) {
  let rank = 0;
  const matches = await GetPlayerMatches(playerName);

  for (let i = 0; i < matches.length; i++) {
    let match = {};
    if (_AbleQueryGetMatchResult) {
      match = await GetMatchResult(matches[i], playerName);
    } else {
      match = matches[i];
    }

    if (CheckMatchCountryCompatibility(match, _ItCountryCode) >= 2) {
      //console.log(match);
      if (match.hasWon) {
        rank = rank + 2;
      } else {
        rank = rank + 1;
      }
    }
  }
  return rank;
}

async function GetPlayerMatches(playerName) {
  const parsedMatches = [];
  try {
    await sleep(randomPause); // Pausa di 0,75 fino a 1,5 secondi
    const response = await axios.get(
      config.api +
        "replays?" +
        "page=1&limit=100&hasBots=false&endedNormally=true"+
        "&date="+PastDateFormated +
        "&date="+TodayteFormated +
        "&players=" + playerName ,
      //                                  {
      //   params: {
      //     page: 1,
      //     limit: 124,
      //     hasBots: false, //considerare i bot oppure no?
      //     endedNormally: true,
      //     players: playerName,
      //     date: "2024-10-22",
      //     date: "2024-11-22",
      //   },
      // }
    );
    for (let i = 0; i < response.data.data.length; i++) {
      parsedMatches[i] = response.data.data[i].id;
    }

    //console.log(parsedMatches);

    return parsedMatches;
  } catch (error) {
    console.log(error);

    throw Error("Error while getting matches");
  }
}

async function GetMatchResult(matchId, playerName) {
  const matchData = {};

  try {
    const response = await axios.get(config.api + "replays/" + matchId);

    // matchData.result = response.data.result;
    matchData.loosingTeam = [];
    matchData.winningTeam = [];

    const teams = response.data.AllyTeams;

    const winTeam = [];
    const losTeam = [];

    // Get winning and loosing team
    for (let i = 0; i < teams.length; i++) {
      for (let ii = 0; ii < teams[i].Players.length; ii++) {
        const player = teams[i].Players[ii];
        const parsedPlayer = {};

        parsedPlayer.name = player.name;
        parsedPlayer.country = player.countryCode;

        if (teams[i].winningTeam) {
          winTeam.push(parsedPlayer);

          if (parsedPlayer.name == playerName) {
            matchData.hasWon = true;
          }
        } else {
          losTeam.push(parsedPlayer);

          if (parsedPlayer.name == playerName) {
            matchData.hasWon = false;
          }
        }
      }
    }

    matchData.loosingTeam = losTeam;
    matchData.winningTeam = winTeam;
  } catch (error) {
    console.log(error);
    throw Error("Error while getting match result");
  } finally {
    return matchData;
  }
}

function CheckMatchCountryCompatibility(match, matchCountry) {
  let matchedPlayers = 0;
  for (let i = 0; i < match.winningTeam.length; i++) {
    if (match.winningTeam[i].country == matchCountry) {
      matchedPlayers++;
    }
  }

  for (let i = 0; i < match.loosingTeam.length; i++) {
    if (match.loosingTeam[i].country == matchCountry) {
      matchedPlayers++;
    }
  }

  return matchedPlayers;
}

// const listita = ["CanestroAnale"]; //lista italiani.

// function CheckTeamCountryCompatibility(team, matchCountry) {
//   //usare teams non team e ciclare teams
//   const matchedPlayers = 0;
//   //aggiunto list di nomi autorizzati ita per chi ha country non ita.
//   for (let i = 0; i < team.length; i++) {
//     if (Listcontain(listita, team[i].name) || team[i].country == matchCountry) {
//       matchedPlayers++;
//     }
//   }

//   return matchedPlayers;
// }

// function Listcontain(list, item) {
//   for (let i = 0; i < list.length; i++) {
//     if (list[i] == item) return true;
//   }
// }
