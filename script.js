
//TODO Overall refactor
//TODO Make "win screen" + implement blockRemaining!

class Block {
    constructor(id) {
        this.id = id;
        this.isFlag = false;
        this.isMine = false;
        this.isPressed = false;
        this.element = null;
    }
}

//VARIABLES
const GAME_STATES = ["playing","lose","win"]
let settings = {
    rows: null,
    columns: null,
    mines: null
}
let board = [];
let isFirstClick= true;
let currentState;
let flagsRemaining;
let blocksRemaining; //implement it

//DOM
const selector = document.querySelector("#select-board");
const resetBtn = document.querySelector("#reset-board");
selector.addEventListener("change",handleSelectChange)
resetBtn.addEventListener("click",handleResetClick);

//Function to create board
function createBoard() {
    //Loops to make 2D Array of blocks
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
}

//Function to setup mines on board
function setMines(excluded){
    let currentMineCount = 0;

    //runs until we have enough mines
    while(currentMineCount < settings.mines) {

        const row = randomNum(0,settings.rows-1);
        const column = randomNum(0,settings.columns-1);
        const block = board[row][column];

        //Check for excluded blocks
        if(excluded && excluded.includes(block.id)) continue;

        //Only place the bomb if the block doesnt have one
        if(!block.isMine) {
            block.isMine = true;
            currentMineCount++;
            continue;
        }
    }
}

//Function to get all the surrounding blocks
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

//Function to get the mine count
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

    let result = check(id,[])
    return result;
}


//DOM CREATING FNs

//Function to create HTML Block /w all the settings,classes,events etc...
function createBlockUI(block) {
    let block_element;
    block_element = document.createElement("div");
    block_element.classList.add("block");
    block_element.addEventListener("click",(event) => handleBlockLeftClick(event,block))
    block_element.addEventListener("contextmenu",(event) => handleBlockRightClick(event,block))
    block.element = block_element;
}


//Function to create HTML Board div /w all the settings based on board;
function createBoardUI() {
    let board_element;
    board_element = document.createElement("div");
    board_element.classList.add("board");
    board_element.setAttribute("style",`grid-template-columns: repeat(${settings.columns}, 1.75vw); grid-template-rows: repeat(${settings.rows}, 1.75vw)`);
    document.body.appendChild(board_element);

    //add all blocks to board HTML container
    board.forEach(row => {
        row.forEach(block => {
            board_element.appendChild(block.element);
        })
    })
}

//EVENT FNs
function handleBlockLeftClick(event,block) {

    //Check if the user has clicked on block for the first time (if true , set mines so user always starts on island)
    if(isFirstClick) {
        const neighbours = [...Object.values(getNeighbours(block.id)).map(block => block?.id),block.id];
        setMines(neighbours);
        isFirstClick = false;
    }

    //Check if game state is still "playing"
    if(currentState === GAME_STATES[0] && !block.isPressed && !block.isFlag) {
        //If we are still playing set block as pressed 
        block.isPressed = true;
        block.element.classList.add("pressed");
        
        //if block is mine ,then we end the game with GAME_STATE[1] -> ("lose")
        if(block.isMine) {
            block.element.textContent = "💣";
            block.element.classList.add("mine");
            currentState = GAME_STATES[1];
        } else { //if block is not mine we check if we clicked on 0 and if its and island
            let islandBlocks = checkForIsland(block.id);
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
                } //if we have 0 flags or more flags and block is already flag we remove it
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

//Handle the select event
function handleSelectChange(event) {

    //We extract the data from option value and setup the settings
    const [rows,columns,mines] = event.target.value.split("x");
    settings.rows = Number(rows);
    settings.columns = Number(columns);
    settings.mines = Number(mines);
    
    //If the board already exit , we reset the board && other variables;
    const existingBoard = document.querySelector(".board");
    if(existingBoard) existingBoard.remove();

    resetAllVariables();
    flagsRemaining = settings.mines;

    //And after all the resets we create the board and make it playable
    createBoard();
    createBoardUI();
}

//Handle the reset btn
function handleResetClick(event) {
    //If the board already exit , we reset the board && other variables;
    const existingBoard = document.querySelector(".board");
    if(existingBoard) {
        resetAllVariables();
        existingBoard.remove()

        //And after all the resets we create the board and make it playable
        createBoard();
        createBoardUI();
    };
}

function resetAllVariables() {
    currentState = GAME_STATES[0];
    board = [];
    isFirstClick = true;
}

export function randomNum(min,max) {
    return Math.floor(Math.random() * (max+1 - min) + min);
}

export function debug(board) {
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