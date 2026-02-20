const ROWS = 9;
const COLS = 9;

const board = [];
const boardElement = document.querySelector(".board");

let selectedTool = "";

const root = document.documentElement;

root.style.setProperty("--rows", ROWS);
root.style.setProperty("--cols", COLS);

// attach event handlers to tools
const toolElements = document.getElementsByClassName("tool");
Array.from(toolElements).forEach((el) => {
	el.addEventListener("click", () => {
		Array.from(toolElements).forEach((tool) =>
			tool.classList.remove("selected"),
		);

		const isAlreadySelected = el.classList.contains("selected");

		if (isAlreadySelected) {
			selectedTool = "";
		} else {
			el.classList.add("selected");
			selectedTool = el.innerText;
		}

		updateHighlightedCells();

		console.log(selectedTool);
	});
});

// init board
for (let y = 0; y < ROWS; y++) {
	board[y] = [];
	for (let x = 0; x < COLS; x++) {
		board[y][x] = {
			x,
			y,
			content: "",
			generated: true,
		};
	}
}

// fill in the board
const CLUES = 36;
fillBoard(board);
removeNumbersForPuzzle(board, CLUES);

// render board
for (let y = 0; y < ROWS; y++) {
	for (let x = 0; x < COLS; x++) {
		const cell = board[y][x];
		const elClass = `cell 
      ${
				(x === 2 || x === 5) && (y === 2 || y === 5)
					? "right-edge bottom-edge"
					: x === 2 || x === 5
						? "right-edge"
						: y === 2 || y === 5
							? "bottom-edge"
							: ""
			}`;

		const el = createElement("div", `cell-${y}-${x}`, elClass, cell.content);

		el.addEventListener("click", () => onCellClick(cell, el));

		boardElement.append(el);
	}
}

/* 
	ai implemented this section, was tired and lazy
	might someday comeback and rewrite it
*/
function fillBoard(board) {
	const empty = findEmpty(board);
	if (!empty) return true; // solved

	const [row, col] = empty;
	const digits = shuffle(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

	for (const d of digits) {
		if (checkIsValidPosition({ x: col, y: row, content: d })) {
			board[row][col].content = d;
			if (fillBoard(board)) return true;
			board[row][col].content = ""; // backtrack
		}
	}

	return false;
}

function findEmpty(board) {
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (!board[r][c].content) return [r, c];
		}
	}
	return null;
}

function shuffle(list) {
	const arr = [...list];

	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
}

function removeNumbersForPuzzle(board, clues) {
	const totalCells = ROWS * COLS;
	const cluesToKeep = Math.max(0, Math.min(clues, totalCells));
	let toRemove = totalCells - cluesToKeep;

	const cells = [];
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			cells.push([y, x]);
		}
	}

	const shuffled = shuffle(cells);

	for (const [y, x] of shuffled) {
		if (!toRemove) break;
		board[y][x].content = "";
		board[y][x].generated = false;
		toRemove--;
	}
}

/* ----------------------------------------- */

function onCellClick(cell, el) {
	if (!selectedTool || cell.generated) return;

	if (cell.content) {
		cell.content = "";
		el.innerText = "";
		el.classList.remove("placed", "invalid");

		updateHighlightedCells();

		return;
	}

	cell.content = selectedTool;
	el.innerText = selectedTool;
	el.classList.remove("placed", "invalid");

	if (!checkIsValidPosition(cell)) {
		el.classList.add("invalid");
	} else {
		el.classList.add("placed");
	}

	updateHighlightedCells();

	if (checkIsValidBoard() && checkIsFullBoard()) {
		endGame();
	}
}

function updateHighlightedCells() {
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			const cell = board[y][x];
			const el = document.getElementById(`cell-${y}-${x}`);
			if (!el) continue;

			const isMatch = selectedTool && String(cell.content) === selectedTool;
			el.classList.toggle("highlighted", Boolean(isMatch));
		}
	}
}

function checkIsValidPosition(cell) {
	for (let i = 0; i < 9; i++) {
		// check cols
		if (i !== cell.x && board[cell.y][i].content === cell.content) return false;
		// check rows
		if (i !== cell.y && board[i][cell.x].content === cell.content) return false;
	}

	const boxStartRow = Math.floor(cell.y / 3) * 3;
	const boxStartCol = Math.floor(cell.x / 3) * 3;

	// check 3x3 boxes
	for (let row = boxStartRow; row < boxStartRow + 3; row++) {
		for (let col = boxStartCol; col < boxStartCol + 3; col++) {
			if (row === cell.y && col === cell.x) continue;
			if (board[row][col].content === cell.content) return false;
		}
	}

	return true;
}

function checkIsValidBoard() {
	let areColsValid = true;

	for (let row = 0; row < ROWS; row++) {
		const colList = [];

		for (let col = 0; col < COLS; col++) {
			colList.push(board[row][col].content);
		}

		if (!checkIsUniqueList(colList)) areColsValid = false;
	}

	let areRowsValid = true;

	for (let col = 0; col < COLS; col++) {
		const rowList = [];

		for (let row = 0; row < ROWS; row++) {
			rowList.push(board[row][col].content);
		}

		if (!checkIsUniqueList(rowList)) areRowsValid = false;
	}

	return areColsValid && areRowsValid;
}

function checkIsFullBoard() {
	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLS; col++) {
			if (!board[row][col].content) return false;
		}
	}

	return true;
}

function endGame() {
	const endgameMessageElement = document.querySelector(".endgame-message");

	endgameMessageElement.innerText = "sudoku is completed!!!";

	const button = createElement("button", "restart", null, "restart");

	button.addEventListener("click", () => {
		location.reload();
	});

	endgameMessageElement.appendChild(button);
}

function checkIsUniqueList(list) {
	const seen = new Set();

	for (const value of list) {
		if (!value) continue;
		if (seen.has(value)) return false;
		seen.add(value);
	}

	return true;
}

function createElement(type, id, className, innerHTML) {
	const element = document.createElement(type);

	if (id) element.id = id;
	if (className) element.className = className;
	if (innerHTML) element.innerHTML = innerHTML;

	return element;
}
