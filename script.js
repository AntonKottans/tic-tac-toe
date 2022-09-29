const state = {
  recording: false,
  scores: [],
  currentMove: null,
  blockedBecouseOfEndGame: false,
  occupiedTiles: [[], [], [], [], []],
};

const nodes = {
  tiles: [],
  makeMove: null,
  confirmMove: null,
  occupiedTileAlert: null,
  winResult: null,
  endGame: null,
  body: null,
};

const constants = {
  coords: [
    [
      ["north", "west"],
      ["north", "north", "west"],
      ["north"],
      ["north", "north", "east"],
      ["north", "east"],
    ],
    [
      ["west", "north", "west"],
      ["middle", "north", "west"],
      ["middle", "north"],
      ["middle", "north", "east"],
      ["east", "north", "east"],
    ],
    [["west"], ["middle", "west"], ["middle"], ["middle", "east"], ["east"]],
    [
      ["west", "south", "west"],
      ["middle", "south", "west"],
      ["middle", "south"],
      ["middle", "south", "east"],
      ["east", "south", "east"],
    ],
    [
      ["south", "west"],
      ["south", "west", "south"],
      ["south"],
      ["south", "east", "south"],
      ["south", "east"],
    ],
  ],
  keyWords: ["west", "south", "east", "north", "middle"],
  xImageStyles: ["x1-tile", "x2-tile", "x3-tile"],
  oImageStyles: ["o1-tile", "o2-tile", "o3-tile"],
  widthX: 5,
};

const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const createRecognition = () => {
  const recognition = new window.webkitSpeechRecognition();
  recognition.lang = "en";
  recognition.continuous = true;
  recognition.maxAlternatives = 5;
  return recognition;
};
const recognition = createRecognition();

const compareArrays = (arr1, arr2) => {
  //console.log(arr1,arr2);
  if (arr1.length !== arr2.length) return false;
  const sortedArr1 = arr1.sort();
  const sortedArr2 = arr2.sort();
  //console.log(sortedArr1,sortedArr2);
  return sortedArr1.every((element, i) => element === sortedArr2[i]);
};

const wordsToJSCoords = (words = []) => {
  if (words.length === 0) return;
  //console.log('words!!!!',words);
  for (let y = 0; y < constants.coords.length; y++)
    for (let x = 0; x < constants.coords[0].length; x++)
      if (compareArrays(constants.coords[y][x], words)) return { x, y };
  //console.log("no coincidence");
};

const recievePossibleWinConditions = (playerOrEnemy) => {
  //12 conditions in total
  const rawLinesToWinConditions = ({ lines, appropriateCoords = null }) => {
    //prettier-ignore
    return lines.map((line, y) => {
      if (line.includes(playerOrEnemy==="enemy"?"player":"enemy")) return null;
      return line.reduce(
        (result, tileOwner, x) => {
          //console.log(tileOwner);
          //console.log('result',result);
          if (tileOwner === "free") {
            result.coordsOfFreeTiles.push(appropriateCoords?appropriateCoords[y][x]:{y,x});
            result.freeTiles++;
          }
          return result;
        },
        { freeTiles: 0, coordsOfFreeTiles: [] }
      );
    }).filter((_) => _);
  };
  //console.log('!!!!!',rawLinesToWinConditions(state.occupiedTiles));

  const recieveVerticalWinConditions = () => {
    //prettier-ignore
    const verticalArr = [...new Array(constants.sideSize)]
      .map((_) => [...new Array(constants.sideSize)]);
    //prettier-ignore
    const appropriateCoords = [...new Array(constants.sideSize)]
    .map((_) => [...new Array(constants.sideSize)]);
    for (let y = 0; y < constants.sideSize; y++)
      for (let x = 0; x < constants.sideSize; x++) {
        verticalArr[y][x] = state.occupiedTiles[x][y];
        appropriateCoords[y][x] = { x: y, y: x };
      }
    return rawLinesToWinConditions({
      lines: verticalArr,
      appropriateCoords,
    });
  };

  const recieveHorizontalWinConditions = () => {
    return rawLinesToWinConditions({
      lines: state.occupiedTiles,
    });
  };

  const recieveDiagonalWinConditions = () => {
    const diagonalLines = [
      [...new Array(constants.sideSize)],
      [...new Array(constants.sideSize)],
    ];
    const appropriateCoords = [...new Array(constants.sideSize)].map((_) => [
      ...new Array(constants.sideSize),
    ]);
    for (let y = 0; y < constants.sideSize; y++)
      for (let x = 0; x < constants.sideSize; x++) {
        diagonalLines[0][x] = state.occupiedTiles[x][x];
        diagonalLines[1][x] =
          state.occupiedTiles[constants.sideSize - 1 - x][x];
        appropriateCoords[0][x] = { x, y: x };
        appropriateCoords[1][x] = {
          x,
          y: constants.sideSize - 1 - x,
        };
      }
    return rawLinesToWinConditions({
      lines: diagonalLines,
      appropriateCoords,
    });
  };
  //const leftToWinCondition = () => {};
  return [
    ...recieveVerticalWinConditions(),
    ...recieveHorizontalWinConditions(),
    ...recieveDiagonalWinConditions(),
  ];
};

const checkEndGame = () => {
  const enemyWinCondition = recievePossibleWinConditions("enemy");
  const playerWinCondition = recievePossibleWinConditions("player");
  //prettier-ignore
  if (enemyWinCondition.length === 0 && playerWinCondition.length === 0)
    return { endOfGame: true, gameResult: "It's a draw!" };
  else if (enemyWinCondition.some((winCondition) => winCondition.freeTiles === 0))
    return { endOfGame: true, gameResult: "Enemy won!" };
  else if (playerWinCondition.some((winCondition) => winCondition.freeTiles === 0))
    return { endOfGame: true, gameResult: "Player won!" };
  else return { endOfGame: false };
};

const checkEndGameAndShowResultsIfNeeded = () => {
  const { endOfGame, gameResult } = checkEndGame();
  if (!endOfGame) return undefined;
  nodes.winResult.innerText = gameResult;
  nodes.endGame.classList.remove("hidden");
};

const makeMove = ({ x, y, playerOrEnemy }) => {
  if (playerOrEnemy === "enemy") {
    nodes.tiles[y][x].classList.add(constants.oImageStyles[randomNumber(0, 2)]);
    state.occupiedTiles[y][x] = "enemy";
  } else {
    nodes.tiles[y][x].classList.add(constants.xImageStyles[randomNumber(0, 2)]);
    state.occupiedTiles[y][x] = "player";
  }
};

const makeMoveAI = () => {
  console.log(
    "recievePossibleWinConditions('enemy')",
    recievePossibleWinConditions("enemy")
  );
  console.log(
    "sort",
    recievePossibleWinConditions("enemy").sort((moveVariant1, moveVariant2) => {
      return moveVariant1.freeTiles - moveVariant2.freeTiles;
    })
  );
  console.log(recievePossibleWinConditions("enemy"));
  const bestwinConditions = recievePossibleWinConditions("enemy")
    .sort((moveVariant1, moveVariant2) => {
      return moveVariant1.freeTiles - moveVariant2.freeTiles;
    })
    .filter((variant, _, arr) => {
      console.log(arr[0], variant);
      return variant.freeTiles === arr[0].freeTiles;
    });
  console.log("bestwinConditions,", bestwinConditions);
  if (bestwinConditions.length) {
    const randombestWinCondition =
      bestwinConditions[randomNumber(0, bestwinConditions.length - 1)];
    const { x, y } =
      randombestWinCondition.coordsOfFreeTiles[
        randomNumber(0, randombestWinCondition.coordsOfFreeTiles.length - 1)
      ];
    makeMove({ x, y, playerOrEnemy: "enemy" });
  } else {
    const playerWinConditions = recievePossibleWinConditions("player");
    if (playerWinConditions.length) {
      const bestPlayerWinCondition = playerWinConditions.sort(
        (moveVariant1, moveVariant2) => {
          return moveVariant1.freeTiles - moveVariant2.freeTiles;
        }
      )[0];
      const { x, y } =
        bestPlayerWinCondition.coordsOfFreeTiles[
          randomNumber(0, bestPlayerWinCondition.coordsOfFreeTiles.length - 1)
        ];
      makeMove({ x, y, playerOrEnemy: "enemy" });
    }
  }
  console.log(
    recievePossibleWinConditions("player").sort(
      (moveVariant1, moveVariant2) => {
        return moveVariant1.freeTiles - moveVariant2.freeTiles;
      }
    )[0]
  );
  checkEndGameAndShowResultsIfNeeded();
};

const findKeywords = (sentence, keyWords = []) => {
  //console.log("recieveKeywordsAndRest", sentence, keyWords);
  sentence = sentence.toLowerCase();
  if (sentence.length === 0) return [];
  if (!keyWords.some((word) => sentence.includes(word))) return [];
  return [
    ...keyWords.filter((word) => sentence.includes(word)),
    ...findKeywords(
      keyWords.reduce((result, word) => result.replace(word, ""), sentence),
      keyWords
    ),
  ];
};

recognition.onresult = ({ results }) => {
  const alternatives = Object.values(results[0]).map(
    (record) => record.transcript
  );
  console.log("alternatives", alternatives);
  console.log("onresult");
  const coords = alternatives
    .map((alternative) => findKeywords(alternative, constants.keyWords))
    .sort((a, b) => b.length - a.length)
    .map((foundKeywords) => wordsToJSCoords(foundKeywords))
    .find((_) => _);
  if (!coords) {
    //console.log("wrong input");
    //todo wrong input alert
    return undefined;
  } else {
    nodes.tiles[coords.y][coords.x].classList.add("highlighted");
    state.currentMove = { x: coords.x, y: coords.y };
    nodes.confirmMove.classList.remove("hidden");
  }
  recognition.stop();
};

createFieldAndTiles = ({ sideSize = 5 }) => {
  constants.sideSize = sideSize;
  const container = document.createElement("div");
  container.classList.add("field");
  nodes.tiles = [...new Array(sideSize)].map((_) => [...new Array(sideSize)]);
  state.occupiedTiles = [...new Array(sideSize)].map((_) => [
    ...new Array(sideSize).fill("free"),
  ]);
  for (let y = 0; y < sideSize; y++)
    for (let x = 0; x < sideSize; x++) {
      const tile = document.createElement("div");
      tile.classList.add("field-tile");
      nodes.tiles[y][x] = tile;
    }
  container.append(...nodes.tiles.flat());
  return container;
};

const confirmMoveHandler = (correctMove) => {
  //prettier-ignore
  nodes.tiles[state.currentMove.y][state.currentMove.x]
      .classList.remove("highlighted");
  nodes.confirmMove.classList.add("hidden");
  if (correctMove === "no") return undefined;
  if (
    state.occupiedTiles[state.currentMove.y][state.currentMove.x] !== "free"
  ) {
    nodes.occupiedTileAlert.classList.remove("hidden");
    return undefined;
  }
  //prettier-ignore
  nodes.tiles[state.currentMove.y][state.currentMove.x]
        .classList.add(constants.xImageStyles[randomNumber(0,2)]);
  //prettier-ignore
  state.occupiedTiles[state.currentMove.y][state.currentMove.x] = "player";
  checkEndGameAndShowResultsIfNeeded();
  makeMoveAI();
};

const startNewGameHandler = (target) => {
  nodes.tiles.flat().forEach((tile) => {
    tile.classList.remove(...constants.oImageStyles, ...constants.xImageStyles);
  });
  state.occupiedTiles.forEach((row) => {
    row.fill("free");
  });
  state.blockedBecouseOfEndGame = false;
};

const makeMoveHandler = ({ target }) => {
  if (state.recording) {
    recognition.stop();
    state.recording = false;
  } else {
    recognition.start();
    state.recording = true;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  nodes.makeMove = document.querySelector("#make-move");
  nodes.winResult = document.querySelector(".end-game-alert-text");
  nodes.endGame = document.querySelector(".end-game-alert-container");
  nodes.confirmMove = document.querySelector(".confirm-container");
  nodes.body = document.querySelector(".body");
  nodes.startNewGame = document.querySelector(".start-new-game");
  nodes.occupiedTileAlert = document.querySelector(
    ".occupied-tile-alert-container"
  );

  nodes.body.addEventListener("click", ({ target }) => {
    if (state.blockedBecouseOfEndGame && !target.matches(".start-new-game"))
      return undefined;
    if (target.matches(".start-new-game")) {
      startNewGameHandler(target);
    }
    if (target.matches(".confirm-yes,.confirm-no")) {
      confirmMoveHandler(target.id);
    }
    if (target.matches(".occupied-tile-alert-container")) {
      nodes.occupiedTileAlert.classList.add("hidden");
    }
    if (target.matches(".end-game-alert-container")) {
      nodes.endGame.classList.add("hidden");
      state.blockedBecouseOfEndGame = true;
    }
    if (target.matches(".make-move")) {
      makeMoveHandler(target);
    }
  });
  document
    .querySelector(".body")
    .insertBefore(createFieldAndTiles({ sideSize: 5 }), nodes.makeMove);
});

recognition.onstart = () => {
  nodes.makeMove.classList.add("recording");
  console.log("onstart");
};

recognition.onend = () => {
  nodes.makeMove.classList.remove("recording");
  console.log("onend");
};
