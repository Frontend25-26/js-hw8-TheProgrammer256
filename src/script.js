const board = document.getElementById("board");
const body = document.getElementById("main");
const delay = 500;

function createBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
}


let currentColor;
let gameOver;
let highlightedCell;

const setStart = function () {
    currentColor = "white";
    gameOver = false;
    highlightedCell = undefined;
    setBg();
}

const setBg = function () {
    body.classList.remove("white");
    body.classList.remove("black");
    body.classList.add(currentColor);
}

const getRow = function (cell) {
    return parseInt(cell.dataset.i);
}

const getCol = function (cell) {
    return parseInt(cell.dataset.j);
}

const getCellAt = function (row, col) {
    if (0 <= row && row < 8 && 0 <= col && col < 8) {
        return board.children[row].children[col];
    }
    return undefined;
}

const getCells = function () {
    const cells = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            cells.push(getCellAt(row, col));
        }
    }
    return cells;
}

const getCellsWithPieces = function (color) {
    return getCells().filter(cell => hasPieceOfColor(cell, color));
}

const getCellsWithOurPieces = function () {
    return getCellsWithPieces(currentColor);
}

const getCellsWithEnemyPieces = function () {
    return getCellsWithPieces(opposite(currentColor));
}

const hasPieceOfColor = function (cell, color) {
    return hasPieceAtCell(cell) && cell.children[0].dataset.color === color;
}

const hasOurPiece = function (cell) {
    return hasPieceOfColor(cell, currentColor);
}

const hasEnemyPiece = function (cell) {
    return hasPieceOfColor(cell, opposite(currentColor));
}

const hasPieceAtCell = function (cell) {
    return cell !== undefined && cell.children.length > 0;
}

const opposite = function (color) {
    return color === "white" ? "black" : "white";
}

const isWithinBounds = function (cell) {
    return cell !== undefined && 0 <= getRow(cell) < 8 && 0 <= getCol(cell) < 8;
}

const isVacant = function (cell) {
    return isWithinBounds(cell) && !hasPieceAtCell(cell);
}

const up = function (cell, d = 1) {
    if (cell === undefined) {
        return undefined;
    }
    const row = currentColor === "white" ? getRow(cell) - d : getRow(cell) + d;
    const col = getCol(cell);
    return getCellAt(row, col);
}

const down = function (cell, d = 1) {
    return up(cell, -d);
}

const left = function (cell, d = 1) {
    if (cell === undefined) {
        return undefined;
    }
    const row = getRow(cell);
    const col = cell.dataset.j - d;
    return getCellAt(row, col);
}

const right = function (cell, d = 1) {
    return left(cell, -d);
}

const upLeft = function (cell, d = 1) {
    return up(left(cell, d), d);
}

const upRight = function (cell,  d = 1) {
    return up(right(cell, d), d);
}

const downLeft = function (cell, d = 1) {
    return down(left(cell, d), d);
}

const downRight = function (cell,  d = 1) {
    return down(right(cell, d), d);
}

const isLastRow = function (cell) {
    if (currentColor === "white") {
        return getRow(cell) === 0;
    } else {
        return getRow(cell) === 7;
    }
}

const hasKingPiece = function (cell) {
    return hasPieceAtCell(cell) && cell.children[0].classList.contains("king");
}

const getTakes = function (cell) {
    const takes = [];
    for (const f of [upLeft, upRight, downLeft, downRight]) {
        let hadEnemy = false;
        for (let d = 2; d < 8; d++) {
            if (hasEnemyPiece(f(cell, d - 1))) {
                hadEnemy = true;
                if (hasEnemyPiece(f(cell, d))) {
                    break;
                }
            }
            if (hasOurPiece(f(cell, d - 1))) {
                break;
            }
            if (hadEnemy && isVacant(f(cell, d))) {
                takes.push({from: cell, to: f(cell, d)});
            }
            if (!hasKingPiece(cell)) {
                break;
            }
        }
    }
    return takes
}

const getAllTakes = function () {
    const takes = [];
    for (const cell of getCellsWithOurPieces()) {
        takes.push(...getTakes(cell));
    }
    return takes;
}

const getPushes = function (cell) {
    const pushes = [];
    if (!hasOurPiece(cell)) {
        return pushes;
    }
    if (hasKingPiece(cell)) {
        for (const f of [upLeft, upRight, downLeft, downRight]) {
            let d = 1;
            while (isVacant(f(cell, d))) {
                pushes.push({from: cell, to: f(cell, d)});
                d++;
            }
        }
    } else {
        if (isVacant(upLeft(cell))) {
            pushes.push({from: cell, to: upLeft(cell)});
        }
        if (isVacant(upRight(cell))) {
            pushes.push({from: cell, to: upRight(cell)});
        }
    }
    return pushes;
}

const getMoves = function (cell) {
    const takes = getAllTakes();
    if (takes.length > 0) {
        return takes.filter(move => move.from === cell);
    }
    return getPushes(cell);
}

const sign = function (n) {
    return n / Math.abs(n);
}

const makeMove = function (from, to) {
    let captured = false;

    console.log(from.getBoundingClientRect());
    from.children[0].style.marginBottom = 2 * (getRow(from) - getRow(to)) * from.getBoundingClientRect().height + "px";
    from.children[0].style.marginLeft = 2 * (getCol(to) - getCol(from)) * from.getBoundingClientRect().width + "px";
    console.log(from.style.width);
    let startI = getRow(from);
    let startJ = getCol(from);
    let endI = getRow(to);
    let endJ = getCol(to);
    const diff = Math.abs(endI - startI);
    let to_delete = [];

    for (let d = 1; d < diff; d++) {
        let i = startI + d * sign(endI - startI);
        let j = startJ + d * sign(endJ - startJ);
        let cell = getCellAt(i, j);
        if (hasEnemyPiece(cell)) {
            cell.children[0].classList.add("deleted");
            to_delete.push(cell.children[0]);
            captured = true;
        }
    }

    setTimeout(() => {
        for (const piece of to_delete) {
            piece.remove();
        }
        from.children[0].style.marginBottom = "0px";
        from.children[0].style.marginLeft = "0px";
        to.appendChild(from.children[0]);
        if (isLastRow(to)) {
            to.children[0].classList.add("king")
        }
        if (getCellsWithEnemyPieces().length === 0) {
            gameOver = true;
            createGameOver();
        }
        if (!captured || getTakes(to).length === 0) {
            currentColor = opposite(currentColor);
            setBg();
        }

    }, delay);
}

const removeHighlights = function () {
    for (const cell of getCells()) {
        cell.classList.remove("highlighted");
    }
}

const createGameOver = function () {
    const msg = document.createElement("p");
    msg.textContent = "Game over - " + currentColor + " wins!";
    body.appendChild(msg);
    const restart = document.createElement("button");
    restart.textContent = "Restart";
    restart.addEventListener("click", function () {
        body.removeChild(msg);
        body.removeChild(restart);
        while (board.firstChild) {
            board.removeChild(board.firstChild);
        }
        play();
    });
    body.appendChild(restart);
}

const addListener = function (cell) {
    cell.addEventListener("click", function () {
        if (hasOurPiece(cell)) {
            removeHighlights();
            if (cell !== highlightedCell) {
                highlightedCell = cell;
                const moves = getMoves(cell);
                cell.classList.add("highlighted");
                for (const move of moves) {
                    move.to.classList.add("highlighted");
                }
            } else {
                highlightedCell = undefined;
            }
        } else if (highlightedCell !== undefined && isVacant(cell) && cell.classList.contains("highlighted")) {
            makeMove(highlightedCell, cell);
            removeHighlights();
            highlightedCell = undefined;
        }
    });
}

const addListeners = function () {
    const cells = getCells();
    for (let i = 0; i < cells.length; i++) {
        addListener(cells[i]);
    }
}

const play = function () {
    createBoard();
    setStart();
    addListeners();
}

play();
