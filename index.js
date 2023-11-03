
//TODO Overall refactor ,but hey it works :)
//TODO Fully test neigbours functionality -> calculating row/column was really funky
//TODO Always start on island!


//DOM
const selector = document.querySelector("#select-board");
const resetBtn = document.querySelector("#reset-board")
selector.addEventListener("change",handleSelectChange)
resetBtn.addEventListener("click",handleResetClick);

//default settings
let settings = {
    columns: 16,
    rows: 16,
    mines: 40,
    block_size: 2
}

//VARIABLES
const GAME_STATES = ["playing","lose","win"]
let board = [];
let currentState;
let blocksRemaining;
let flagsRemaining;

class Block {
    constructor(id) {
        this.id = id;
        this.isFlag = false;
        this.isMine = false;
        this.isPressed = false;
        this.element = null;
    }
}

//GAMEPLAY FNs
function createBoard() {
    let currentId = 0;
    for(let r = 0; r < settings.rows; r++) {
        board[r] = [];
        for(let c = 0; c < settings.columns; c++) {
            const block = new Block(currentId);
            board[r][c] = block;
            createBlockUI(block)
            currentId++;
        }
    }

    setMines();
}

function setMines(){
    let currentMineCount = 0;
    while(currentMineCount < settings.mines) {

        const row = randomNum(0,settings.rows-1);
        const column = randomNum(0,settings.columns-1);
        
        const block = board[row][column];

        if(!block.isMine) {
            block.isMine = true;
            currentMineCount++;
            continue;
        }
    }
}

function getNeighbours(blockId) {
    const row = Math.floor(blockId / settings.columns);
    const column = Math.floor(blockId % settings.columns);


    const neighbours = {
        north_west: board[row-1]?.[column-1],
        north: board[row-1]?.[column],
        north_east: board[row-1]?.[column+1],
        west: board[row]?.[column-1],
        east: board[row]?.[column+1],
        south_west: board[row+1]?.[column-1],
        south: board[row+1]?.[column],
        south_east: board[row+1]?.[column+1],
    }

    return neighbours;
}

function getMineCount(neighbours) {
    let mineCount = 0;
    for(let block of Object.values(neighbours)) {
        if(block && block.isMine) {
            mineCount += 1;
        }
    }
    return mineCount;
}

function checkForIsland(id) {
    function check(blockId,alreadyVisitedArr) {
        //Check only if block wasnt already visited
        if(!alreadyVisitedArr.includes(blockId)) {
            //Add currently checked block to already visited array
            alreadyVisitedArr.push(blockId);
            //Check for neigbours
            const neighbours = getNeighbours(blockId);
            //Get mine count
            const mineCount = getMineCount(neighbours);

            //For each neighbour check if there even is neighbour and if there are no mines around
            for(let block of Object.values(neighbours)) {
                //If condition is true , recursively check with new block until the island is created
                if(block && mineCount === 0) {
                    check(block.id,alreadyVisitedArr);
                }
            }
        }
        return alreadyVisitedArr;
    }

    //Invoke check with first ID and empty visited
    let result = check(id,[])
    return result;
}

//UTILS FNs
function randomNum(min,max) {
    return Math.floor(Math.random() * (max+1 - min) + min);
}

//DOM CREATING FNs
function createBlockUI(block) {
    let block_element;
    block_element = document.createElement("div");
    block_element.classList.add("block");
    block_element.addEventListener("click",(event) => handleBlockLeftClick(event,block))
    block_element.addEventListener("contextmenu",(event) => handleBlockRightClick(event,block))
    block_element.id = block.id;
    block.element = block_element;
}

function createBoardUI() {
    let board_element;
    board_element = document.createElement("div");
    board_element.classList.add("board");
    board_element.setAttribute("style",`grid-template-columns: repeat(${settings.columns}, ${settings.block_size}rem); grid-template-rows: repeat(${settings.rows}, ${settings.block_size}rem)`);
    document.body.appendChild(board_element);

    board.forEach(row => {
        row.forEach(block => {
            board_element.appendChild(block.element);
        })
    })
}

//EVENT FNs
function handleBlockLeftClick(event,block) {
    //Check if game state is still "playing"
    if(currentState === GAME_STATES[0]) {
        //If we are still playing set block as pressed 
        block.isPressed = true;
        block.element.classList.add("pressed");
        //if block is mine ,then we end the game with GAME_STATE[1] -> ("lose")
        if(block.isMine) {
            block.element.textContent = "💣";
            block.element.classList.add("mine");
            currentState = GAME_STATES[1];
        } 
        //if block is not mine we check if we clicked on 0 and if its and island
        else {
            let islandBlocks = checkForIsland(block.id);

            blocksRemaining = blocksRemaining - islandBlocks.length;
            if(blocksRemaining === 0) currentState = GAME_STATES[2]
            // if the island is made out of more than 1 block 
            // if its just 1 block we just set a number and press the block otherwise we select whole island and remove 0s

            if(islandBlocks.length > 1) {
                board.forEach(row => {
                    row.forEach(block => {
                        if(islandBlocks.includes(block.id)) {
                            block.element.classList.add("pressed");
                            let neighbours = getNeighbours(block.id);
                            let mineCount = getMineCount(neighbours);
                            if(mineCount === 0) {
                                block.element.textContent = "";
                                block.element.classList.add("zero");
                            } else {
                                block.element.textContent = mineCount;
                            }
                            block.isPressed = true;
                        }
                    })
                })
            } else {
                let neighbours = getNeighbours(block.id);
                let mineCount = getMineCount(neighbours);
                block.element.classList.add("pressed");
                block.element.textContent = mineCount;
            }
            
        }
    }
}

function handleBlockRightClick(event,block) {
    //Check if game state is still "playing"
    if(currentState === GAME_STATES[0]) {
        //Prevent opening up the "rightclick menu"
        event.preventDefault();
    
        //Check if user clicked on right btn
        if (event.button === 2) {
            //Dont do anything if block is already pressed (cant place flag on already pressed block)
            if(!block.isPressed) {
                //If there is already a flag , remove it
    
                //check if we still have flagsLeft => if true and block is not already a flag then place it
                if(flagsRemaining !== 0 && !block.isFlag) {
                    block.isFlag = true;
                    block.element.classList.add("flagged");
                    block.element.textContent = "🚩";
                    flagsRemaining--;
                } 
                //if we have 0 flags or more flags and block is already flag we remove it
                else if((flagsRemaining === 0 && block.isFlag) || (flagsRemaining > 0 && block.isFlag)) {
                    block.isFlag = false;
                    block.element.classList.remove("flagged");
                    block.element.textContent = "";
                    flagsRemaining++;
                }
            } 
        }
    }
}

function handleSelectChange(event) {

    const existingBoard = document.querySelector(".board");

    const [rows,columns,mines] = event.target.value.split("x");
    settings.rows = Number(rows);
    settings.columns = Number(columns);
    settings.mines = Number(mines);

    if(existingBoard) {
        board = [];
        existingBoard.remove()
    };

    currentState = GAME_STATES[0];
    blocksRemaining = (settings.rows * settings.columns) - settings.mines;
    flagsRemaining = settings.mines;

    createBoard();
    createBoardUI();
}

function handleResetClick(event) {
    const existingBoard = document.querySelector(".board");
    if(existingBoard) {
        currentState = GAME_STATES[0];
        board = [];
        existingBoard.remove()

        createBoard();
        createBoardUI();
    };
}

//DEBUG FNs
function debug() {
    board.forEach(row => {
        row.forEach(block => {
            //Show all mines & block IDs
            if(block.isMine) {
                block.element.textContent = "💣"
                block.element.classList.add("pressed");
            } else {
                block.element.textContent = block.id;
            }
        })
    })
}



