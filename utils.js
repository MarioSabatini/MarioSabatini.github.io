function newParseObj(fileContent, mtlFile) {

    function stringToNumber(value) {
        const number = [];
        for (const str of value) {
            number.push(parseFloat(str));
        }
        return number;
    }

    const position = [];
    const texcord = [];
    const normal = [];

    const finalposition = [];
    const finaltexcord = [];
    const finalnormal = [];
    // Crea un array per le facce associate a questo materiale
    const faces = [];
    const materials = [];
    const texture = [];

    const lines = fileContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const [command, ...values] = line.split(' ', 4);

        if (command === 'v')
            position.push(stringToNumber(values));

        else if (command === 'vt')
            texcord.push(stringToNumber(values));

        else if (command === 'vn')
            normal.push(stringToNumber(values));

        //for the material
        else if (command === 'usemtl') {
            texture.push(findTexture(mtlFile, values[0]))
            //read all the faces until the new "usemtl"
            // Salva il materiale corrente

            materials.push(values[0]);
            const faceData = {
                positions: [],
                texCoords: [],
                normals: []
            }; // Oggetto per memorizzare i dati della faccia
            // Cicla fino a trovare un nuovo usemtl o la fine del file
            while (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                const [commandFace, ...valuesFace] = nextLine.split(' ', 4);


                if (commandFace === 'usemtl') {
                    faces.push({
                        positions: faceData.positions.flat(),
                        texCoords: faceData.texCoords.flat(),
                        normals: faceData.normals.flat()
                    });
                    break; // Esci dal ciclo se trovi un nuovo usemtl
                } else if (commandFace === 'f') {

                    for (const group of valuesFace) {
                        const [positionIndex, texIndex, normalIndex] = stringToNumber(group.split('/'));
                        //we create the position normal and texcord array 
                        finalposition.push(...position[positionIndex - 1]);
                        finaltexcord.push(...texcord[texIndex - 1]);
                        finalnormal.push(...normal[normalIndex - 1]);

                        // Aggiungi le posizioni, le normali e le texture all'oggetto faceData
                        faceData.positions.push(position[positionIndex - 1]);
                        faceData.texCoords.push(texcord[texIndex - 1]);
                        faceData.normals.push(normal[normalIndex - 1]);
                    }
                }
                //se sono all'ultima riga
                if (i + 2 === lines.length) {
                    faces.push({
                        positions: faceData.positions.flat(),
                        texCoords: faceData.texCoords.flat(),
                        normals: faceData.normals.flat()

                    });
                }
                i++; // Passa alla prossima riga
            }

        }

    }
    return {
        position: finalposition.flat(),
        texcoord: finaltexcord.flat(),
        normal: finalnormal.flat(),
        faces: faces,
        texture: texture,
    };

}

function linkProgram(vs, fs, prog, gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    gl.attachShader(prog, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    gl.attachShader(prog, fragmentShader);

    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }
    return prog;
}

function findTexture(file, materialName) {
    const lines = file.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const [command, ...values] = line.split(' ', 4);

        if (command === "newmtl") {
            if (values[0] === materialName) {
                while (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    const [newCommand, ...newValues] = nextLine.split(' ', 4);
                    if (newCommand === "newmtl")
                        return "none";
                    if (newCommand === "map_Kd") {
                        const filename = newValues[0].split('/').pop();
                        return filename;
                    }
                    i++;
                }

            }
        }

    }
}

function degToRad(d) {
    return d * Math.PI / 180;
}

function setAttrUniform(progToSet, gl) {
    // Crea un oggetto per contenere le location degli uniform
    const uniforms = {
        modelLoc: gl.getUniformLocation(progToSet, 'uModel'),
        viewLoc: gl.getUniformLocation(progToSet, 'uView'),
        projectionLoc: gl.getUniformLocation(progToSet, 'uProjection'),
        lightPositionLoc: gl.getUniformLocation(progToSet, "u_lightWorldPosition"),
        viewWorldPositionLoc: gl.getUniformLocation(progToSet, "u_viewWorldPosition"),
        shininessLoc: gl.getUniformLocation(progToSet, "u_shininess"),
        lightDirectionLoc: gl.getUniformLocation(progToSet, "u_lightDirection"),
        limitLoc: gl.getUniformLocation(progToSet, "u_limit"),
        textureMatrixLoc: gl.getUniformLocation(progToSet, "u_textureMatrix"),
        samplerLoc: gl.getUniformLocation(progToSet, "uSampler"),
        uColorLoc: gl.getUniformLocation(progToSet, "u_color"),
        biasLoc: gl.getUniformLocation(progToSet, "u_bias"),
        selectLoc: gl.getUniformLocation(progToSet, "u_selectTiles"),
        idTilesLoc: gl.getUniformLocation(progToSet, "u_tilesId"),
        selectShadowLoc: gl.getUniformLocation(progToSet, "u_selectShadow"),
        normalMatrixLoc: gl.getUniformLocation(progToSet,"uNormalMatrix"),
        sphereLoc: gl.getUniformLocation(progToSet,"u_sphere")
    };

    // Restituisci l'oggetto con le location degli uniform
    return uniforms;
}

function loadTexture(gl, url, width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Riempie la texture con un colore blu mentre la texture viene caricata
    const level = 0;
    const internalFormat = gl.RGBA;

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, internalFormat, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = url;

    return texture;
}

// Calcola le posizioni dei tasselli
function calculateTilePositions(rows, cols, tileSize) {
    const tilePositions = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = j * tileSize; // Posizione X
            const z = i * tileSize; // Posizione Z

            tilePositions.push({ x, z });
        }
    }
    return tilePositions;
}

// Calcola le posizioni dei tasselli e delle caselle per i pezzi mangiati
function calculateTileDeathPositions(rows, cols, tileSize) {
    const tilePositions = [];
    const initialPositionRight = 9;
    const initialPositionleft = -3;
    // Calcola le posizioni delle caselle ai lati della scacchiera
    for (let i = 0; i < 2; i++) { // Due file
        for (let j = 0; j < 8; j++) {
            var x = initialPositionRight * tileSize + (i * tileSize) ;
            var z = j * tileSize;
            tilePositions.push({ x, z });
        }
    }
    
     // Calcola le posizioni delle caselle ai lati della scacchiera
     for (let i = 0; i < 2; i++) { // Due file
        for (let j = 0; j < 8; j++) {
            var x = initialPositionleft * tileSize + (i * tileSize) ;
            var z = j * tileSize;
            tilePositions.push({ x, z });
        }
    }
    return tilePositions;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
var occupiedDeathPositions = [];
function calculateDethPosition(tileDeathPosition, color){
    //le prime 16 posiizioni nell'array sono per i bianchi
    var randomNumber;
    if(color == "bianchi"){
        do {
            randomNumber = getRandomNumber(0, 15); 
        } while (occupiedDeathPositions.includes(randomNumber)); 
        occupiedDeathPositions.push(randomNumber);
        return{ x:tileDeathPosition[randomNumber].x, 
                z: tileDeathPosition[randomNumber].z
        }
    }else{
        do {
            randomNumber = getRandomNumber(16, 31); 
        } while (occupiedDeathPositions.includes(randomNumber)); 
        
        occupiedDeathPositions.push(randomNumber);
        return{ x:tileDeathPosition[randomNumber].x, 
                z: tileDeathPosition[randomNumber].z
        }
    }
}

const piecePositions = [
    // Bianchi
    { x: 0 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 2, id: 0, type: "torre", color: "bianchi" }, // Torre bianca
    { x: 7 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 2, id: 1, type: "torre", color: "bianchi" }, // Torre bianca
    { x: 1 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 1, id: 2, type: "cavallo", color: "bianchi" }, // Cavallo bianco
    { x: 6 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 1, id: 3, type: "cavallo", color: "bianchi" }, // Cavallo bianco
    { x: 2 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 0, id: 4, type: "alfiere", color: "bianchi" }, // Alfieri bianchi
    { x: 5 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 0, id: 5, type: "alfiere", color: "bianchi" }, // Alfieri bianchi
    { x: 3 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 3, id: 6, type: "regina", color: "bianchi" }, // Regina bianca
    { x: 4 * 2, z: 0 * 2, textureIndex: 2, dataIndex: 4, id: 7, type: "re", color: "bianchi" }, // Re bianco
    { x: 0 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 8, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 1 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 9, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 2 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 10, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 3 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 11, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 4 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 12, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 5 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 13, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 6 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 14, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco
    { x: 7 * 2, z: 1 * 2, textureIndex: 2, dataIndex: 5, id: 15, type: "pedone", init: 1, color: "bianchi" }, // Pedone bianco

    // Neri
    { x: 0 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 2, id: 16, type: "torre", color: "neri" }, // Torre nera
    { x: 7 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 2, id: 17, type: "torre", color: "neri" }, // Torre nera
    { x: 1 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 1, id: 18, type: "cavallo", color: "neri" }, // Cavallo nero
    { x: 6 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 1, id: 19, type: "cavallo", color: "neri" }, // Cavallo nero
    { x: 2 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 0, id: 20, type: "alfiere", color: "neri" }, // Alfieri neri
    { x: 5 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 0, id: 21, type: "alfiere", color: "neri" }, // Alfieri neri
    { x: 3 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 3, id: 22, type: "regina", color: "neri" }, // Regina nera
    { x: 4 * 2, z: 7 * 2, textureIndex: 3, dataIndex: 4, id: 23, type: "re", color: "neri" }, // Re nero
    { x: 0 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 24, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 1 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 25, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 2 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 26, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 3 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 27, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 4 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 28, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 5 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 29, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 6 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 30, type: "pedone", init: 1, color: "neri" }, // Pedone nero
    { x: 7 * 2, z: 6 * 2, textureIndex: 3, dataIndex: 5, id: 31, type: "pedone", init: 1, color: "neri" }, // Pedone nero
];

function createFrameBuffer(gl) {
    //frameBuffer 
    const instanceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, instanceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, instanceTexture, 0);

    // Controlla se il framebuffer è completo
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer is not complete: ' + status.toString());
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fbo;
}

function createDepthBuffer(gl) {
    //depth Buffer
    // 1. Attiva l'unità di texture
    gl.activeTexture(gl.TEXTURE2); // Usa l'unità di texture 2
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT, // internal format
        canvas.width,   // width
        canvas.height,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.UNSIGNED_INT,    // type
        null);              // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0);                  // mip level
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return depthFramebuffer;
}

function setMovement(tileID, tilesInfo, pieceSelected, tilePositions) {
    var tilesToMove = [];
    var checkMovement = [];
    if (tilesInfo[tileID].pieceTile != "none") {
        pieceSelected = tilesInfo[tileID].pieceTile;
        var pieceType = piecePositions[pieceSelected].type;
        var color = piecePositions[pieceSelected].color;
        var tileX = tilePositions[tileID].x;
        var tileZ = tilePositions[tileID].z;
        const direction = (color === "bianchi") ? 1 : -1; // Direzione del movimento

        // Funzione per controllare se la casella è occupata
        const checkAndPush = (stepsf, stepsd, stepsl) => {
            // Moltiplica direction per gli elementi di stepsd e stepsl
            // Controlla se stepsd è un array, altrimenti lascialo come intero
            const modifiedStepsd = Array.isArray(stepsd) ? stepsd.map(step => step * direction) : stepsd * direction;
            const modifiedStepsl = Array.isArray(stepsl) ? stepsl.map(step => step * direction) : stepsl * direction;

            const tileToCheck = findTiles([tileX, tileZ], stepsf * direction, modifiedStepsd, modifiedStepsl);
            if (tileToCheck != null) {
                if (tilesInfo[tileToCheck].pieceTile === "none") {
                    checkMovement.push(tileToCheck);
                    return true;
                }
                return false;
            }

        };

        // Funzione per controllare quando mangiare i pezzi
        const checkAndEat = (stepsf, stepsd, stepsl) => {
            // Controlla se stepsd è un array, altrimenti lascialo come intero
            const modifiedStepsd = Array.isArray(stepsd) ? stepsd.map(step => step * direction) : stepsd * direction;
            const modifiedStepsl = Array.isArray(stepsl) ? stepsl.map(step => step * direction) : stepsl * direction;
            const tileToCheck = findTiles([tileX, tileZ], stepsf * direction, modifiedStepsd, modifiedStepsl);
            if (tileToCheck != null) {

                if (tilesInfo[tileToCheck].pieceTile != "none") {
                    if (piecePositions[tilesInfo[tileToCheck].pieceTile].color != color) {
                        checkMovement.push(tileToCheck);
                        return true;
                    }
                }

            }
            return false;
        };

        const processLinearMovement = (initialF, initialL, directionF, directionL) => {
            let f = initialF;
            let l = initialL;

            // Incrementa f in base alla direzione
            while (checkAndPush(f, 0, 0)) {
                if (directionF > 0)
                    f++
                else
                    f--
            }
            checkAndEat(f, 0, 0);

            // Incrementa l in base alla direzione
            while (checkAndPush(0, 0, l)) {
                if (directionL > 0)
                    l++;
                else
                    l--;
            }
            checkAndEat(0, 0, l);
        };

        const processDiagonalMovement = (initialD, direction1, direction2) => {
            let d = initialD;

            // Movimento diagonale in una direzione
            while (checkAndPush(0, [d * direction1, d * direction2], 0)) {
                d++;
            }
            checkAndEat(0, [d * direction1, d * direction2], 0);
        };


        if (pieceType === "pedone") {
            // Controlliamo se il pedone è in posizione iniziale
            const isInitialPosition = piecePositions[pieceSelected].init === 1;
            if (isInitialPosition) {
                nextMov = checkAndPush(1, 0, 0);
                if (nextMov === true)
                    checkAndPush(2, 0, 0);

            } else {
                // Controlla il movimento normale
                checkAndPush(1, 0, 0);
            }
            checkAndEat(0, [1, 1], 0);
            checkAndEat(0, [-1, 1], 0);
        } else if (pieceType === "cavallo") {
            //caselle per il cavallo
            checkAndPush(0, [1, 2], 0)
            checkAndPush(0, [-1, 2], 0)

            checkAndPush(0, [2, 1], 0)
            checkAndPush(0, [-2, 1], 0)

            checkAndPush(0, [1, -2], 0)
            checkAndPush(0, [-1, -2], 0)

            checkAndPush(0, [2, -1], 0)
            checkAndPush(0, [-2, -1], 0)
            //caselle per mangiare
            checkAndEat(0, [1, 2], 0)
            checkAndEat(0, [-1, 2], 0)

            checkAndEat(0, [2, 1], 0)
            checkAndEat(0, [-2, 1], 0)

            checkAndEat(0, [1, -2], 0)
            checkAndEat(0, [-1, -2], 0)

            checkAndEat(0, [2, -1], 0)
            checkAndEat(0, [-2, -1], 0)
        }
        else if (pieceType === "torre") {
            processLinearMovement(1, 1, 1, 1);  // Direzione positiva
            processLinearMovement(-1, -1, -1, -1); // Direzione negativa
        }
        else if (pieceType === "alfiere") {
            processDiagonalMovement(1, 1, 1);  // Diagonale positiva
            processDiagonalMovement(1, -1, 1); // Diagonale negativa
            processDiagonalMovement(1, 1, -1); // Diagonale negativa (sinistra)
            processDiagonalMovement(1, -1, -1);  // Diagonale positiva (sinistra)
        } else if (pieceType === "regina") {
            processLinearMovement(1, 1, 1, 1);  // Direzione positiva
            processLinearMovement(-1, -1, -1, -1); // Direzione negativa
            processDiagonalMovement(1, 1, 1);  // Diagonale positiva
            processDiagonalMovement(1, -1, 1); // Diagonale negativa
            processDiagonalMovement(1, 1, -1); // Diagonale negativa (sinistra)
            processDiagonalMovement(1, -1, -1);  // Diagonale positiva (sinistra)
        } else if (pieceType === "re") {
            checkAndPush(1, 0, 0);
            checkAndPush(-1, 0, 0);
            checkAndPush(0, 0, 1);
            checkAndPush(0, 0, -1);
            checkAndPush(0, [1, 1], 0);
            checkAndPush(0, [-1, 1], 0);
            checkAndPush(0, [1, -1], 0);
            checkAndPush(0, [-1, -1], 0);

            checkAndEat(1, 0, 0);
            checkAndEat(-1, 0, 0);
            checkAndEat(0, 0, 1);
            checkAndEat(0, 0, -1);
            checkAndEat(0, [1, 1], 0);
            checkAndEat(0, [-1, 1], 0);
            checkAndEat(0, [1, -1], 0);
            checkAndEat(0, [-1, -1], 0);
        }

    }
    //inserisco le caselle dove poter muoversi 
    tilesToMove = [...checkMovement];
    return { tilesToMove, pieceSelected };
}

//trova la casella corrispondente in base al numero di movimenti da eseguire
function findTiles(current, f, d, l) {
    const [currentX, currentZ] = current; // Estrai le coordinate correnti
    let newX = currentX / 2;
    let newZ = currentZ / 2;


    // Calcola la nuova posizione in base ai movimenti
    if (f) {
        newZ += f; // Avanti
    }
    if (d) {
        newX += d[0]; // Diagonale destra
        newZ += d[1]; // Diagonale avanti
    }
    if (l) {
        newX += l; // Diagonale sinistra
    }
    // Controlla se la nuova posizione è valida (dentro i limiti della scacchiera)
    if (newX >= 0 && newX < 8 && newZ >= 0 && newZ < 8) {

        return newZ * 8 + newX; // ID = (riga * numero di colonne) + colonna
    }

    return null; // Restituisci null se la posizione non è valida
}

function simulateKeyDown(key) {
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      keyCode: key.charCodeAt(0), 
      which: key.charCodeAt(0), 
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }
  // Funzione per simulare l'evento keyup
  function simulateKeyUp(key) {
    const event = new KeyboardEvent('keyup', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      keyCode: key.charCodeAt(0), 
      which: key.charCodeAt(0), 
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }

  function getDeviceType() {
    const userAgent = navigator.userAgent;
  
    if (/android/i.test(userAgent)) {
      return 'Android';
    } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
      return 'iOS';
    } else {
      return 'Other';
    }
  }
// Funzione lambda per ottenere le posizioni iniziali e gli ID
const getInitialPositions = (pieces) => pieces.map(({ x, z, id }) => ({ x, z, id }));

const initialPositions = getInitialPositions(piecePositions);
console.log(initialPositions)
  function resetPieces(){
    initialPositions.forEach(element => {
        piecePositions.forEach(piece =>{
            if(piece.init == 0){
                piece.init = 1;
            }
            if(element.id === piece.id){
                piece.x = element.x;
                piece.z = element.z;
            }
        });
    });
  }

  function setTilesInfo(){
    const tilesInfo = [];
    for (let i = 0; i < 64; i++) {
        const id = i;
        const pieceTile = "none";
        tilesInfo.push({ id, pieceTile });
      }
      return tilesInfo;
  }

  function generateSphere(radius, latitudeBands, longitudeBands) {
    const vertices = [];
    const textureCoords = [];
    const indices = [];

    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        const theta = latNumber * Math.PI / latitudeBands; // Angolo di elevazione
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longitudeBands; // Angolo di azimut
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Coordinate della sfera
            const x = radius * sinTheta * cosPhi;
            const y = radius * cosTheta;
            const z = radius * sinTheta * sinPhi;

            vertices.push(x, y, z);

            // Coordinate texture
            const u = longNumber / longitudeBands;
            const v = latNumber / latitudeBands;
            textureCoords.push(u, v);
        }
    }

    // Genera gli indici per i triangoli
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
            const first = (latNumber * (longitudeBands + 1)) + longNumber;
            const second = first + longitudeBands + 1;

            indices.push(first);
            indices.push(second);
            indices.push(first + 1);

            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        textureCoords: new Float32Array(textureCoords),
        indices: new Uint16Array(indices)
    };
}

// Esempio di utilizzo
const radius = 1; // Raggio della sfera
const latitudeBands = 30; // Numero di bande di latitudine
const longitudeBands = 30; // Numero di bande di longitudine
const sphereData = generateSphere(radius, latitudeBands, longitudeBands);