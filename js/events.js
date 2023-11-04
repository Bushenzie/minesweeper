export function handleBlockLeftClick(event,block) {
    clickedBlockId = block.id;
    console.log(clickedBlockId);
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

export function handleBlockRightClick(event,block) {
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

export function handleSelectChange(event) {

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
    setMines();
    createBoardUI();
    debug();
}

export function handleResetClick(event) {
    const existingBoard = document.querySelector(".board");
    if(existingBoard) {
        currentState = GAME_STATES[0];
        board = [];
        existingBoard.remove()

        createBoard();
        setMines();
        createBoardUI();
        debug();
    };
}