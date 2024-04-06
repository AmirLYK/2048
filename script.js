import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const gameBoard = document.getElementById("game-board");
const backButton = document.querySelector('.backButton');
const reloadButton = document.querySelector('.reloadButton');
const grid = new Grid(gameBoard);
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
setupInputOnce();
function setupInputOnce() {
  window.addEventListener("keydown", handleInput, {once: true});
}

function setupClickOnce() {
  backButton.addEventListener('click', handleClick, {once: true});
}

reloadButton.addEventListener("click", function() {
  window.location.reload();
});

async function handleClick() {
  console.log('Кнопка нажата');
  grid.lastCell.unlinkTile();
  grid.lastCell.unlinkTileForMerge();
  grid.lastTile.removeFromDOM();
  for (let cell of grid.cells) {
    if (cell.linkedTile != null) {
      cell.linkedTile.removeFromDOM();
      cell.unlinkTile();
      cell.unlinkTileForMerge();
    }
  }
  console.log(grid.lastCondition);
  for (let i = 0; i < grid.cells.length; i++) {
    let new_cell = grid.cells[i];
    if (grid.lastCondition[i].linkedTile != null) {
      new_cell.linkTile(new Tile(gameBoard));
      new_cell.linkedTile.setXY(grid.lastCondition[i].linkedTile.x, grid.lastCondition[i].linkedTile.y);
      new_cell.linkedTile.setValue(grid.lastCondition[i].linkedTile.value);
      
    }

    console.log('tqwer');
  }
}

async function handleInput(event) {
  switch (event.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInputOnce();
        return;
      }
      grid.lastCondition = JSON.parse(JSON.stringify(grid.cells))
      await moveUp()
      grid.lastEvent = 'ArrowUp'
      break;
    
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInputOnce();
        return;
      }
      grid.lastCondition = JSON.parse(JSON.stringify(grid.cells))
      await moveDown()
      grid.lastEvent = 'ArrowDown'
      break;

    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInputOnce();
        return;
      }
      grid.lastCondition = JSON.parse(JSON.stringify(grid.cells))
      await moveLeft();
      grid.lastEvent = 'ArrowLeft'
      break;

    case "ArrowRight":
      if (!canMoveRight()) {
        setupInputOnce();
        return;
      }
      grid.lastCondition = JSON.parse(JSON.stringify(grid.cells))
      await moveRight()
      grid.lastEvent = 'ArrowRight'
      break;
    
    default:
      setupInputOnce();
      return;
  }

  const newTile = new Tile(gameBoard);
  grid.lastTile = newTile;
  grid.lastCell = grid.getRandomEmptyCell() 
  grid.lastCell.linkTile(newTile);


  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    await newTile.waitForAnimationEnd();
    alert("Try again");
    return;
  }
  setupInputOnce();
  setupClickOnce();

}

async function moveUp() {
  await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() {
  await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft() {
  await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight() {
  await slideTiles(grid.cellsGroupedByReversedRow);
}


async function slideTiles(groupedCells) {
  const promises = [];
  groupedCells.forEach(group => slideTilesInGroup(group, promises));

  await Promise.all(promises);

  grid.cells.forEach(cell => {
    cell.hasTileForMerge() && cell.mergeTiles();
  })
}

function slideTilesInGroup(group, promises) {
  for (let i = 1; i < group.length; i++) {
    if (group[i].isEmpty()) {
      continue;
    }

    const cellWithTile = group[i];

    let targetCell;
    let j = i - 1;
    while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
      targetCell = group[j];
      j--;
    }

    if (!targetCell) {
      continue;
    }

    promises.push(cellWithTile.linkedTile.waitForTransitionEnd());
    
    if (targetCell.isEmpty()) {
      targetCell.linkTile(cellWithTile.linkedTile);
    }
    else {
      targetCell.linkTileForMerge(cellWithTile.linkedTile);
    }

    cellWithTile.unlinkTile();
  }
}

function canMoveUp() {
  return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveLeft() {
  return canMove(grid.cellsGroupedByRow);
}

function canMoveRight() {
  return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCells) {
  return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) {
  return group.some( (cell, index) => {
    if (index === 0) {
      return false;
    }

    if (cell.isEmpty()) {
      return false;
    }

    const targetCell = group[index - 1];
    return targetCell.canAccept(cell.linkedTile);
  })
}

