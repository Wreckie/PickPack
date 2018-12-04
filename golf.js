window.addEventListener("load", RunGame);

        function RunGame()
        {
            //Globals
            var GAME_WIDTH = 1200;
            var GAME_HEIGHT = 1200;

            //store sprites here
            var sprites = {};

            //get canvas and context
            var canvas = document.getElementById("gameCanvas");
            var context = canvas.getContext("2d");

            //event listeners
            canvas.addEventListener("mousedown", OnClick);
            canvas.addEventListener("mouseup", OnRelease);
            canvas.addEventListener("mousemove", OnMove);

            //array to store tiles
            var tiles = [];
            //bag dimensions and position
            var bagTileWidth = 12;
            var bagTileHeight = 7;
            var bagOriginX = 100;
            var bagOriginY = 200;
            //box slots center positions
            var slotX = 200;
            var slotWidth = 300;
            var slotY = 775;
            //initialize all the tiles in the bag
            for (var i = 0; i < bagTileWidth; i++)
            {
                for (var j = 0; j < bagTileHeight; j++)
                {
                    tiles.push(new Tile(bagOriginX + (i * 50), bagOriginY + (j * 50)));
                }
            }
            //array to hold the names of items to be spawned randomly
            var itemNames = ["ball", "ballpackm", "ballpackl", "teepack", "teebag", "scorecards", "waterbottles", "waterbottlel", "banana", "orange", "bar", "sandwich", "umbrella", "visor", "sunglasses", "keys", "glove", "shoes"];
            //array to hold the values of the items for scoring purposes
            var itemValues = [1, 6, 15, 3, 10, 6, 3, 14, 6, 6, 4, 25, 10, 19, 8, 3, 18, 26];

            //array to hold the tile data for each item
            var itemTileData = [CreateTileData(1, 1), CreateTileData(2, 2), CreateTileData(3, 3), CreateTileData(1, 2), CreateTileData(2, 3), CreateTileData(2, 2), CreateTileData(2, 1), CreateTileData(4, 2), CreateTileData(3, 2, [[0, 0],[1, 0]]), CreateTileData(2, 2), CreateTileData(1, 3), CreateTileData(4, 5, [[0, 0],[1, 0],[0, 3],[0, 4],[3, 4]]), CreateTileData(2, 5, [[0, 0],[1, 3],[1, 4]]), CreateTileData(3, 5, [[0, 0],[0, 4],[2, 0]]), CreateTileData(2, 4, [[0, 0],[0, 1]]), CreateTileData(2, 2, [[0, 0]]), CreateTileData(5, 3, [[0, 2],[1, 2],[3, 2],[4, 2]]), CreateTileData(4, 6, [[0, 0],[0, 4],[0, 5],[1, 5],[3, 0]])];

            //array to hold buttons
            var buttons = [];

            buttons.push(new Button('skipitems', 985, 675));
            buttons.push(new Button('endgame', 985, 800));

            //array to hold all the PackItem objects currently on the canvas
            var visibleItems = [];

            //score variables
            var equipmentScore = 0;
            var accessoriesScore = 0;
            var suppliesScore = 0;
            var baseScore = 0;
            var totalScore = 0;
            var bonusNameArray = ["Base Score", "Equipped", "Well-Equipped", "Supplied", "Well-Supplied", "Accessorized", "Well-Accessorized", "Loads o' Balls", "Teed Up", "Fruity", "Hydrated", "Deal With It", "Weatherproof", "Poorly Equipped", "Poorly Supplied", "Poorly Accessorized", "No Balls", "Thirsty", "Hungry"];
            var bonusScoreArray = [baseScore, 1000, 1500, 1000, 1500, 1000, 1500, 400, 200, 200, 400, 200, 200, -750, -750, -750, -1000, -500, -500];
            var bonusEarnedArray = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
            var bonuses = [];
            //click and drag variables
            var itemClicked = false; //whether a draggable item has been clicked
            var clickedItem; //reference to the clicked item
            var clickOffsetX; //horizontal offset of the click
            var clickOffsetY; //vertical offset of the click
            var scaleFactor; //factor by which the window is scaled from the game's native resolution
            var clickedItemInitX; //initial x position of the clicked item - used for returning incorrectly placed items
            var clickedItemInitY; //initial y position of the clicked item - used for returning inccorectly placed items
            var currentItemIndex; //array index of the clicked item (this will be used to skip the current item when checking collision)

            //number of spawns remaining before end of game
            var numSpawns = 21;

            //activity bool
            var gameActive = true;

            //tile class, takes the tile position as parameters
            function Tile(x, y)
            {
                //track how many items the tile is covered by
                this.covered = 0;
                //track whether the tile is covered by an item that isn't moving
                this.locked = false;
                //draw method for the tile
                this.Draw = function()
                {
                    if (this.covered == 2)
                    {
                        context.drawImage(sprites.tileD, x, y);
                    }
                    else if (this.covered == 1)
                    {
                        context.drawImage(sprites.tileC, x, y);
                    }
                    else 
                    {
                        context.drawImage(sprites.tileU, x, y);
                    }
                }
            }
            //PackItem class, instantiated every time a new object is spawned
            function PackItem(name, value, category, tileData, x, y)
            {
                //name of item (used for bonus calculation)
                this.name = name;
                //position of the item
                this.x      = x;
                this.y      = y;
                //get the width and height of the spawned sprite by its name for drag/drop detection
                this.width  = sprites[name].width;
                this.height = sprites[name].height;
                //item value and category for scoring purposes:  0 = equipment, 1 = supplies, 2 = accessories
                this.value = value;
                this.category = category;
                //tileData for collision purposes
                this.tileData = tileData;
                //whether the item is in the bag or not
                this.inBag  = false;

                //reference to the image object
                var sprite   = sprites[name];

                //draw method for the item
                this.Draw = function()
                {
                    context.drawImage(sprite, this.x, this.y)
                }
                this.AddScore = function()
                {
                    switch(this.category)
                    {
                        case 0:
                            equipmentScore += this.value;
                            if (equipmentScore > 60)
                            {
                                equipmentScore = 60;
                            }
                            break;
                        case 1:
                            suppliesScore += this.value;
                            if (suppliesScore > 60)
                            {
                                suppliesScore = 60;
                            }
                            break;
                        case 2:
                            accessoriesScore += this.value;
                            if (accessoriesScore > 60)
                            {
                                accessoriesScore = 60;
                            }
                            break;
                    }
                }
            }

            function Button(name, x, y)
            {
                this.hovered = false;
                this.y = y;

                this.Draw = function()
                {
                    if (this.hovered)
                    {
                        context.drawImage(sprites[name + "H"], x, y);
                    }
                    else
                    {
                        context.drawImage(sprites[name + "U"], x, y);
                    }
                }
            }   

            //executes on click event
            function OnClick(event)
            {
                //only left-clicks should do anything and only if the game is active
                if (event.which === 1 && gameActive)
                {
                    //by default we have not clicked an item
                    itemClicked = false;
                    //grab the width of the game's playable area and use it to calculate the scale factor
                    scaleFactor = window.innerWidth / GAME_WIDTH;
                    //where the mouse was clicked
                    var mouseX = event.pageX;
                    var mouseY = event.pageY;
                    //iterate through all our clickables and see if we clicked any of them
                    var numItems = visibleItems.length;
                    for (var i = 0; i < numItems; i++)
                    {
                        //calculate where in the game space the item starts being drawn (horizontally) and stops
                        var minX = visibleItems[i].x * scaleFactor;
                        var maxX = minX + (visibleItems[i].width * scaleFactor);
                        //if the click was within these bounds, check vertically
                        if (mouseX >= minX && mouseX <= maxX)
                        {
                            //calculate where in the game space the item starts being drawn (vertically) and stops
                            var minY = visibleItems[i].y * scaleFactor;
                            var maxY = minY + (visibleItems[i].height * scaleFactor);
                            //if the click was within these bounds, then we have clicked on an item
                            if (mouseY >= minY && mouseY <= maxY)
                            {
                                //set the bool to true
                                itemClicked = true;
                                //store a reference to the clicked item
                                clickedItem = visibleItems[i];
                                //break the loop, this ensures we can only click one item at a time and don't waste time on unnecessary iterations
                                break;
                            }
                        }
                    }
                    //if we have clicked an item, we must calculate its offset so it can follow the mouse nicely
                    if (itemClicked)
                    {
                    	//record the initial position of the item
                    	clickedItemInitX = clickedItem.x;
                    	clickedItemInitY = clickedItem.y;
                        //record the array index of the clicked item 
                        currentItemIndex = i;
                        //also record the index in the array we found it at so we can access it when we move it in the OnMove function
                        //calculate the offsets
                        clickOffsetX = (mouseX / scaleFactor) - clickedItem.x;
                        clickOffsetY = (mouseY / scaleFactor) - clickedItem.y;
                        if (clickedItem.inBag)
                        {
                            UnlockTiles();
                        }
                    }
                    //we may have clicked a button
                    else if (buttons[0].hovered)
                    {
                        SkipItems();
                    }
                    else if (buttons[1].hovered)
                    {
                        EndGame();
                    }
                }
            }

            //executes whenever the mouse moves
            function OnMove(event)
            {
                //we only need to do anything if we have clicked an item or are over a button AND the game is active
                if (gameActive)
                {
                    if (itemClicked)
                    {
                        //calculate the new position of the item, factoring in the offset
                        var unsnappedX = (event.pageX / scaleFactor) - clickOffsetX;
                        var unsnappedY = (event.pageY / scaleFactor) - clickOffsetY; 

                        //now snap it to the 50x50 grid
                        var xDiff = unsnappedX % 50;
                        var yDiff = unsnappedY % 50;

                        //if the difference between the position and the grid is half or less the grid size, snap it leftwards
                        if (xDiff <= 25)
                        {
                            var snappedX = unsnappedX - xDiff;
                        }
                        //otherwise, snap it rightwards
                        else
                        {
                            var snappedX = unsnappedX + (50 - xDiff);
                        }

                        //repeat for y
                        if (yDiff <= 25)
                        {
                            var snappedY = unsnappedY - yDiff;
                        }
                        else
                        {
                            var snappedY = unsnappedY + (50 - yDiff);
                        }
                        //if the tiling position of the item has changed due to this movement, update the position of the item
                        if (snappedX != clickedItem.x || snappedY != clickedItem.y)
                        {
                            clickedItem.x = snappedX;
                            clickedItem.y = snappedY;
                            //also update the tile collision
                            UpdateTiles();
                        }
                    }
                    // so we aren't holding an item; are we hovering over a button?
                    else
                    {
                        buttons[0].hovered = false;
                        buttons[1].hovered = false;
                        scaleFactor = window.innerWidth / GAME_WIDTH;
                        //where the mouse was clicked
                        var mouseX = event.pageX;
                        var mouseY = event.pageY;
                        //iterate through the buttons and see if we're hovering on any of them
                        var minX = 985 * scaleFactor;
                        var maxX = minX + (181 * scaleFactor);
                        //if the click was within these bounds, check vertically
                        if (mouseX >= minX && mouseX <= maxX)
                        {
                            for (var i = 0; i < 2; i++)
                            {
                                //calculate where in the game space the button starts (vertically) and stops. all buttons are the same height
                                var minY = buttons[i].y * scaleFactor;
                                var maxY = minY + (76 * scaleFactor);
                                //if the click was within these bounds, then we are hovering over a button
                                if (mouseY >= minY && mouseY <= maxY)
                                {
                                    buttons[i].hovered = true;
                                }
                            }
                        }
                    }
                }
            }

            //execute when the mouse button is unpressed
            function OnRelease(event)
            {
                //only LMB releases do anything and only if the game is active
                if (event.which === 1 && gameActive)
                {
                    //we only need to take an action if something was clicked
                    if (itemClicked)
                    {
                        //update the bool; we are no longer clicking anything
                        itemClicked = false;

                        //check to see if the item can be dropped into the bag at the current position
                        var xPos 		= clickedItem.x;
                        var yPos 		= clickedItem.y;
                        var dropHere 	= true;

                        //first check the top left corner
                        if (xPos >=  100 && yPos >= 200)
                        {
                        	//then check the bottom right corner
                        	if (xPos + clickedItem.width <= 700 && yPos + clickedItem.height <= 550)
                        	{
                                //if any of the tiles are double covered, we cannot drop the item here
                                for (var i = 0; i < 84; i++)
                                {
                                    if (tiles[i].covered == 2)
                                    {
                                        dropHere = false;
                                        break;
                                    }
                                }
                        	}
                            else
                            {
                                dropHere = false;
                            }
                        }
                        else
                        {
                            dropHere = false;
                        }

                        //if we can't drop the item at the current position, put it back where we found it and re-cover the tiles it was on
                       	if (!dropHere)
                       	{
    	                    clickedItem.x = clickedItemInitX;
    	                    clickedItem.y = clickedItemInitY;
                            UpdateTiles();
                    	}
                        //otherwise we can drop it
                        else
                        {
                            //if the item we are moving was not in the bag before, we can spawn new items when it drops in and update the score
                            if (!clickedItem.inBag)
                            {
                                //update the inBag property
                                clickedItem.inBag = true;
                                var temp = [];
                                var numItems = visibleItems.length;
                                for (var i = 0; i < numItems; i++)
                                {
                                    if (visibleItems[i].inBag)
                                    {
                                        temp.push(visibleItems[i]);
                                    }
                                }
                                visibleItems = temp.slice(0);
                                clickedItem.AddScore();
                                SpawnIn();
                            }
                        }
                        //lock the tiles
                        for (var i = 0; i < 84; i++)
                        {
                            if (tiles[i].covered == 1)
                            {
                                tiles[i].locked = true;
                            }
                        }
                    }
                }
            }
            function UpdateTiles()
            {
                for (var i = 0; i < 84; i++)
                {
                    if (!tiles[i].locked)
                    {
                        tiles[i].covered = 0;
                    }
                    else
                    {
                        tiles[i].covered = 1;
                    }
                }
                var currTileX = (clickedItem.x / 50) - 2;
                var currTileY = (clickedItem.y / 50) - 4;
                var currTileData = clickedItem.tileData;
                var itemWidth = currTileData[0].length;
                var itemHeight = currTileData.length;
                if (currTileX >= 0 && currTileX + itemWidth <= 12 && currTileY >= 0 && currTileY + itemHeight <= 7)
                {
                    tileNum = (currTileX * 7) + currTileY;

                    for (var i = 0; i < itemHeight; i++)
                    {
                        for (var j = 0; j < itemWidth; j++)
                        {
                            if (currTileData[i][j] == 1)
                            {
                                var changeTile = tileNum + (7 * j) + i;
                                tiles[changeTile].covered += 1;
                            }
                        }                                               
                    }
                }
            }

            function UnlockTiles()
            {
                var currTileX = (clickedItem.x / 50) - 2;
                var currTileY = (clickedItem.y / 50) - 4;
                var currTileData = clickedItem.tileData;
                var itemWidth = currTileData[0].length;
                var itemHeight = currTileData.length;
                if (currTileX >= 0 && currTileX + itemWidth <= 12 && currTileY >= 0 && currTileY + itemHeight <= 7)
                {
                    tileNum = (currTileX * 7) + currTileY;

                    for (var i = 0; i < itemHeight; i++)
                    {
                        for (var j = 0; j < itemWidth; j++)
                        {
                            if (currTileData[i][j] == 1)
                            {
                                var changeTile = tileNum + (7 * j) + i;
                                tiles[changeTile].locked = false;
                            }
                        }                                               
                    }
                }
            }

            //disable the right-click context menu
            canvas.oncontextmenu = function()
            {
                return false;
            }

            //spawn in three random items from the pool
            function SpawnIn()
            {
                numSpawns--;
                if (numSpawns == 0)
                {
                    EndGame();
                    return;
                }
                //get two random numbers between 0 and 17
                var rand1 = GetRandom(18);
                var rand2 = GetRandom(18);
                //reroll if they're the same
                while (rand1 == rand2)
                {
                    rand2 = GetRandom(18);
                }
                //get a third random number, reroll if it's the same as any of the others
                var rand3 = GetRandom(18);
                while (rand3 == rand2 || rand3 == rand1)
                {
                    rand3 = GetRandom(18);
                }
                //now we have three distinct random numbers
                //create each one as a PackItem object so they can be drawn in a line
                //position them so they draw in the middle of their respective item boxes so they look neat
                visibleItems.push(new PackItem(itemNames[rand1], itemValues[rand1], Math.floor(rand1 / 6), itemTileData[rand1], slotX - (sprites[itemNames[rand1]].width / 2), slotY - (sprites[itemNames[rand1]].height / 2)));
                visibleItems.push(new PackItem(itemNames[rand2], itemValues[rand2], Math.floor(rand2 / 6), itemTileData[rand2], (slotX + slotWidth) - (sprites[itemNames[rand2]].width / 2), slotY - (sprites[itemNames[rand2]].height / 2)));
                visibleItems.push(new PackItem(itemNames[rand3], itemValues[rand3], Math.floor(rand3 / 6), itemTileData[rand3], (slotX + (2 * slotWidth)) - (sprites[itemNames[rand3]].width / 2), slotY - (sprites[itemNames[rand3]].height / 2)));
            }

            function SkipItems()
            {
                var temp = [];
                var numItems = visibleItems.length;
                for (var i = 0; i < numItems; i++)
                {
                    if (visibleItems[i].inBag)
                    {
                        temp.push(visibleItems[i]);
                    }
                }
                visibleItems = temp.slice(0);
                SpawnIn();
            }

            function EndGame()
            {
                baseScore = (equipmentScore + suppliesScore + accessoriesScore) * 100;
                bonusScoreArray[0] = baseScore;
                var itemsInBag = [];
                var numItems = visibleItems.length;
                for (var i = 0; i < numItems; i++)
                {
                    if (visibleItems[i].inBag)
                    {
                        itemsInBag.push(visibleItems[i]);
                    }
                }

                var numBagItems = itemsInBag.length;
                var ballScore = 0;
                var teeScore = 0
                var waterScore = 0;
                var fruitScore = 0;
                var foodScore = 0;


                for (var i = 0; i < numBagItems; i++)
                {
                    var itemName = itemsInBag[i].name;
                    var itemValue = itemsInBag[i].value;
                    if (itemName.includes("ball"))
                    {
                        ballScore += itemValue;
                    }
                    if (itemName.includes("tee"))
                    {
                        teeScore += itemValue
                    }
                    if (itemName.includes("water"))
                    {
                        waterScore += itemValue;
                    }
                    if (itemName == "banana" || itemName == "orange")
                    {
                        fruitScore += itemValue;
                        foodScore += itemValue;
                    }
                    if (itemName == "sandwich")
                    {
                        foodScore += itemValue;
                    }
                    if (itemName == "sunglasses")
                    {
                        bonusEarnedArray[11] = true;
                    }
                    if (itemName == "umbrella")
                    {
                        bonusEarnedArray[12] = true;
                    }                   
                }

                if (equipmentScore < 30)
                {
                    bonusEarnedArray[13] = true;
                }
                else if(equipmentScore >= 45)
                {
                    bonusEarnedArray[2] = true;
                }
                else
                {
                    bonusEarnedArray[1] = true;
                }

                if (suppliesScore < 30)
                {
                    bonusEarnedArray[14] = true;
                }
                else if (suppliesScore >= 45)
                {
                    bonusEarnedArray[4] = true;
                }
                else
                {
                    bonusEarnedArray[3] = true;
                }

                if (accessoriesScore < 30)
                {
                    bonusEarnedArray[15] = true;
                }
                else if (accessoriesScore >= 45)
                {
                    bonusEarnedArray[6] = true;
                }
                else
                {
                    bonusEarnedArray[5] = true;
                }
                if (ballScore == 0)
                {
                    bonusEarnedArray[16] = true;
                }
                else if (ballScore > 20)
                {
                    bonusEarnedArray[7] = true;
                }
                if (teeScore > 15)
                {
                    bonusEarnedArray[8] = true;
                }
                if (fruitScore > 17)
                {
                    bonusEarnedArray[9] = true;
                }
                if (waterScore > 15)
                {
                    bonusEarnedArray[10] = true;
                }
                else if (waterScore < 5)
                {
                    bonusEarnedArray[17] = true;
                }
                if (foodScore < 10)
                {
                    bonusEarnedArray[18] = true;
                }

                for (var i = 0; i < 19; i++)
                {
                    if (bonusEarnedArray[i])
                    {
                        var bonusString = "";
                        totalScore += bonusScoreArray[i];
                        bonusString += bonusNameArray[i];
                        bonusString += ": ";
                        bonusString += bonusScoreArray[i];
                        bonuses.push(bonusString);
                    }
                }
                gameActive = false;
            }

            //get a random number with a minumum value of 0 and a maximum value of param - 1 
            function GetRandom(int)
            {
                return Math.floor(Math.random() * int)
            }

            //given the dimensions of an item and the locations of its blanks, creates a two-dimensional tile array for the item
            function CreateTileData(x, y, blanks = [])
            {
                //array will contain x 'rows'
                var mat = new Array(x);
              
                for (var i = 0; i < x; i++)
                {
                    mat[i] = [];
                    for (var j = 0; j < y; j++)
                    {
                        //and y 'columns'
                        //filled tiles have a value of 1
                        mat[i].push(1);
                    }
                }
                //add in the blanks
                for (var k = 0; k < blanks.length; k++)
                {
                    //blank tiles have a value of 0
                    mat[blanks[k][0]][blanks[k][1]] = 0;
                }
                return mat;
            }

            //loads all assets on startup
            function Load()
            {
                //static UI elements
                sprites.gametitle       = new Image();
                sprites.rucksack        = new Image();
                sprites.box             = new Image();
                sprites.equipmentbar    = new Image();
                sprites.accessoriesbar  = new Image();
                sprites.suppliesbar     = new Image();
                sprites.skipitemsU      = new Image();
                sprites.skipitemsH      = new Image();
                sprites.endgameU        = new Image();
                sprites.endgameH        = new Image();
                sprites.gameover        = new Image();
                sprites.gametitle.src       = 'sprites/gametitle.png';
                sprites.rucksack.src        = 'sprites/rucksack.png';
                sprites.box.src             = 'sprites/box.png';
                sprites.equipmentbar.src    = 'sprites/EquipmentBar.png';
                sprites.accessoriesbar.src  = 'sprites/AccessoriesBar.png';
                sprites.suppliesbar.src     = 'sprites/SuppliesBar.png';
                sprites.skipitemsU.src      = 'sprites/SkipButtonU.png';
                sprites.skipitemsH.src      = 'sprites/SkipButtonH.png';
                sprites.endgameU.src        = 'sprites/EndButtonU.png';
                sprites.endgameH.src        = 'sprites/EndButtonH.png';
                sprites.gameover.src        = 'sprites/gameover.png';


                //tiles
                sprites.tileU = new Image();
                sprites.tileC = new Image();
                sprites.tileD = new Image();
                sprites.tileU.src = 'sprites/tileU.png';
                sprites.tileC.src = 'sprites/tileC.png';
                sprites.tileD.src = 'sprites/tileD.png';
                
                //equipment items
                sprites.ball        = new Image();
                sprites.ballpackm   = new Image();
                sprites.ballpackl   = new Image();
                sprites.teepack     = new Image();
                sprites.teebag      = new Image();
                sprites.scorecards  = new Image();

                sprites.ball.src        = 'sprites/ball.png';
                sprites.ballpackm.src   = 'sprites/ballpackm.png';
                sprites.ballpackl.src   = 'sprites/ballpackl.png';
                sprites.teepack.src     = 'sprites/teepack.png'
                sprites.teebag.src      = 'sprites/teebag.png';
                sprites.scorecards.src  = 'sprites/scorecards.png';

                //supply items
                sprites.waterbottles    = new Image();
                sprites.waterbottlel    = new Image();
                sprites.banana          = new Image();
                sprites.orange          = new Image();
                sprites.bar             = new Image();
                sprites.sandwich        = new Image();

                sprites.waterbottles.src    = 'sprites/waterbottles.png';
                sprites.waterbottlel.src    = 'sprites/waterbottlel.png';
                sprites.banana.src          = 'sprites/banana.png';
                sprites.orange.src          = 'sprites/orange.png';
                sprites.bar.src             = 'sprites/bar.png';
                sprites.sandwich.src        = 'sprites/sandwich.png';

                //accessory items
                sprites.umbrella    = new Image();
                sprites.visor       = new Image();
                sprites.sunglasses  = new Image();
                sprites.keys        = new Image();
                sprites.glove       = new Image();
                sprites.shoes       = new Image();

                sprites.umbrella.src    = 'sprites/umbrella.png';
                sprites.visor.src       = 'sprites/visor.png';
                sprites.sunglasses.src  = 'sprites/sunglasses.png';
                sprites.keys.src        = 'sprites/keys.png';
                sprites.glove.src       = 'sprites/glove.png';
                sprites.shoes.src       = 'sprites/shoes.png';
            }

            //update and redraw
            function Update()
            {
                //clear the canvas
                context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                //draw the game if it's active
                if (gameActive)
                {
                    //draw static UI elements

                    //context.drawImage(sprites.gametitle, 0, 0);
                    context.drawImage(sprites.rucksack, 25, 100);
                    context.drawImage(sprites.box, 50, 650);
                    
                    for (var i = 0; i < 2; i++)
                    {
                        buttons[i].Draw();
                    }

                    //draw score bars

                    context.fillStyle = "#00FFFF";
                    context.fillRect(117, 88, (163 / 60) * equipmentScore, 13);
                    context.fillStyle = "#9FFF00";
                    context.fillRect(317, 88, (163 / 60) * suppliesScore, 13);
                    context.fillStyle = "#B600FF";
                    context.fillRect(517, 88, (160 / 60) * accessoriesScore, 13);

                    //draw remaining spawns

                    context.fillStyle = "#000000";
                    context.font = "32px Arial";
                    context.fillText("Spawns Left: " + (numSpawns - 1), 700, 640);

                    //draw score bar UI
                    context.drawImage(sprites.equipmentbar, 100, 0);
                    context.drawImage(sprites.suppliesbar, 300, 0);
                    context.drawImage(sprites.accessoriesbar, 500, 0);

                    //draw tiles
                    var numTiles = tiles.length;
                    for (var i = 0; i < numTiles; i++)
                    {
                        tiles[i].Draw();
                    }

                    //draw all the visible pack items onto the canvas
                    var numVis = visibleItems.length;
                    for (var i = 0; i < numVis; i++)
                    {
                        visibleItems[i].Draw();
                    }
                }
                //otherwise draw the game over screen
                else
                {
                    context.drawImage(sprites.gameover, 0, 0);
                    context.fillStyle = "#000000";
                    context.font = "32px Arial";
                    var startDraw = 250;
                    var numBonuses = bonuses.length;
                    for (var i = 0; i < numBonuses; i++)
                    {
                        context.fillText(bonuses[i], 375, startDraw);
                        startDraw += 32;
                    }
                    //context.fillText(bonusString, 200, 200);
                    context.font = "80px Arial Bold";
                    context.fillText(totalScore, 450, 800);
                }

                //update when the browser is ready to load
                window.requestAnimationFrame(Update);
            }

            //load the assets
            Load();
            //spawn a set of 3 random items
            SpawnIn();
            //initial kick to set up the update loop
            Update();

        }