async function main() {

  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  //se il dispositivo è ios o android mostro i comandi a schermo
  const deviceType = getDeviceType();
  if (deviceType == "iOS" || deviceType == "Android") {
    console.log(deviceType)
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('controlsCamera').style.display = 'flex';
  } else {
    document.getElementById('controls').style.display = 'none';
    document.getElementById('controlsCamera').style.display = 'none';
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl");

  const ext = gl.getExtension('WEBGL_depth_texture');
  if (!ext) {
    return alert('need WEBGL_depth_texture');
  }
  //prendo il codice del fragment e vertex shader
  const vs = document.getElementById('vs').text;
  const fs = document.getElementById('fs').text;
  const fsColor = document.getElementById('fsColor').text;
  const vsColor = document.getElementById('vsColor').text;
  //linko i programmi
  const mainProgram = gl.createProgram();
  linkProgram(vs, fs, mainProgram, gl);

  const colorProgram = gl.createProgram();
  linkProgram(vsColor, fsColor, colorProgram, gl);

  gl.useProgram(mainProgram);
  //prendo la location gli attributi
  positionLoc = gl.getAttribLocation(mainProgram, "aPosition");
  texcordLoc = gl.getAttribLocation(mainProgram, "aTexCoord");
  normalLoc = gl.getAttribLocation(mainProgram, "aNormal");
  //prendo la location delle uniforms
  var uniforms = setAttrUniform(mainProgram, gl);

  const responseMtl = await fetch('obj/pezzo_pavimento.mtl');
  const textMtl = await responseMtl.text();
  const response = await fetch('obj/pezzo_pavimento.obj');
  const text = await response.text();
  const data = newParseObj(text, textMtl);

  var arrayOfBuffersPos = gl.createBuffer();
  var arrayOfBuffersNorm = gl.createBuffer();
  var arrayOfBuffersTex = gl.createBuffer();

  //position
  arrayOfBuffersPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.faces[0].positions), gl.STATIC_DRAW);
  //normal
  arrayOfBuffersNorm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersNorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.faces[0].normals), gl.STATIC_DRAW);

  //texture
  arrayOfBuffersTex = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersTex);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.faces[0].texCoords), gl.STATIC_DRAW);

  //carico i pezzi degli scacchi
  var namePiecesMtl = ['pieces/alfiere.mtl', 'pieces/cavallo.mtl', 'pieces/torre.mtl', 'pieces/regina.mtl', 'pieces/re.mtl', 'pieces/pedone.mtl']
  var namePiecesObj = ['pieces/alfiere.obj', 'pieces/cavallo.obj', 'pieces/torre.obj', 'pieces/regina.obj', 'pieces/re.obj', 'pieces/pedone.obj']
  var respondePiecesMtl = [];
  var respondePiecesObj = [];
  var textPiecesMtl = [];
  var textPiecesObj = [];
  var dataPieces = []

  for (let i = 0; i < namePiecesObj.length; i++) {
    respondePiecesMtl[i] = await fetch(namePiecesMtl[i]);
    respondePiecesObj[i] = await fetch(namePiecesObj[i]);

    textPiecesMtl[i] = await respondePiecesMtl[i].text();
    textPiecesObj[i] = await respondePiecesObj[i].text();
    dataPieces[i] = newParseObj(textPiecesObj[i], textPiecesMtl[i]);
  }

  //creo un buffer per le posizioni normali e coordinate texture per ogni pezzo
  var bufferOfPiecesPos = [];
  var bufferOfPiecesNorm = [];
  var bufferOfPiecesTex = [];
  for (let i = 0; i < namePiecesObj.length; i++) {
    bufferOfPiecesPos[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesPos[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataPieces[i].faces[0].positions), gl.STATIC_DRAW);

    bufferOfPiecesNorm[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesNorm[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataPieces[i].faces[0].normals), gl.STATIC_DRAW);

    bufferOfPiecesTex[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesTex[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataPieces[i].faces[0].texCoords), gl.STATIC_DRAW);
  }

  //carico il cubo con la mia foto
  const responseCubeMtl = await fetch('obj/cube_face.mtl');
  const textCubeMtl = await responseCubeMtl.text();
  const responseCube = await fetch('obj/cube_face.obj');
  const textCube = await responseCube.text();
  const dataCube = newParseObj(textCube, textCubeMtl);

  var cubePos = [];
  var cubeNorm = [];
  var cubeTex = [];

  //position
  for (let i = 0; i < dataCube.faces.length; i++) {
    cubePos[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePos[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataCube.faces[i].positions), gl.STATIC_DRAW);
    //normal
    cubeNorm[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNorm[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataCube.faces[i].normals), gl.STATIC_DRAW);

    //texture
    cubeTex[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTex[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataCube.faces[i].texCoords), gl.STATIC_DRAW);
  }

  //carico il tavolo
  const responseTableMtl = await fetch('obj/table.mtl');
  const textTableMtl = await responseTableMtl.text();
  const responseTable = await fetch('obj/table.obj');
  const textTable = await responseTable.text();
  const dataTable = newParseObj(textTable, textTableMtl);

  var tablePos = [];
  var tableNorm = [];
  var tableTex = [];
  for (let i = 0; i < dataTable.faces.length; i++) {
    //position
    tablePos[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tablePos[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataTable.faces[i].positions), gl.STATIC_DRAW);

    //normal
    tableNorm[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tableNorm[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataTable.faces[i].normals), gl.STATIC_DRAW);

    //texture
    tableTex[i] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tableTex[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataTable.faces[i].texCoords), gl.STATIC_DRAW);
  }

  //carico la semi sfera
  const responseSphereMtl = await fetch('obj/stars_cupola.mtl');
  const textSphereMtl = await responseSphereMtl.text();
  const responseSphere = await fetch('obj/stars_cupola.obj');
  const textSphere = await responseSphere.text();
  const dataSphere = newParseObj(textSphere, textSphereMtl);

  //position
  spherePos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spherePos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataSphere.faces[0].positions), gl.STATIC_DRAW);

  //normal
  sphereNorm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereNorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataSphere.faces[0].normals), gl.STATIC_DRAW);

  //texture
  sphereTex = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereTex);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataSphere.faces[0].texCoords), gl.STATIC_DRAW);

  //  carico le texture
  const texture1 = loadTexture(gl, 'textures/marmo_nero_texture.jpg');
  const texture2 = loadTexture(gl, 'textures/marmo_texture.jpg');
  const texture3 = loadTexture(gl, 'textures/marmo_bianco_pezzi.jpg');
  const texture4 = loadTexture(gl, 'textures/marmo_nero_pezzi.jpg');
  const texture5 = loadTexture(gl, 'textures/yellow.jpg');
  const texture6 = loadTexture(gl, 'textures/green.jpg');
  const texture7 = loadTexture(gl, 'textures/face_autor.jpg');
  const texture8 = loadTexture(gl, 'textures/legno.jpg');
  const texture9 = loadTexture(gl, 'textures/stars.jpg');

  //abilito gli attributi 
  gl.enableVertexAttribArray(positionLoc);
  gl.enableVertexAttribArray(normalLoc);
  gl.enableVertexAttribArray(texcordLoc);

  //matrix
  const view = m4.identity();
  const projection = m4.identity();
  const model = m4.identity();
  const camera = m4.identity();
  const normalMatrix = m4.identity();
  gl.uniformMatrix4fv(uniforms.normalMatrixLoc, false, normalMatrix);

  //valori per la prospective matrix
  const fov = degToRad(60);
  const zNear = 0.1;
  const zFar = 1000;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  m4.perspective(fov, aspect, zNear, zFar, projection);

  // Array per memorizzare le posizioni dei tasselli
  var tilePositions = calculateTilePositions(8, 8, 2.0);
  var tileDeathPositions = calculateTileDeathPositions(8, 8, 2.0);
  var tilesInfo = setTilesInfo();

  //eventi per quando i tasti della tastiera vengono premuti, gestiscono il movimento
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLocaleLowerCase()] = false;
    e.preventDefault();
  });
  //valori iniziali per la telecamera, utilizzati per costruire la view matrix
  let px = 7;
  let py = 5;
  let pz = 20;

  let ang = 0;
  const speed = 10;
  //camera[8] etc.. sono i componenti della direzione in cui la telecamera è orientata
  var forward = [camera[8], camera[9], camera[10]]; // Direzione "forward"
  var right = [camera[0], camera[1], camera[2]]; // Direzione "right"
  var targetZ = pz + forward[2];
  let then = 0;
  //creazione del frame e depth buffer, il primo utilizzato per il picking dei tasselli e il secondo per le ombre
  const fbo = createFrameBuffer(gl);
  const depthFrameBuffer = createDepthBuffer(gl);

  //gui section 
  // Crea un oggetto settings per memorizzare i valori
  var settings = {
    limitValue: 20,
    lightX: 20,
    lightY: 30,
    lightZ: 50,
    shininess: 50,
    enableShadows: true,
    enableCredits: false,
    staticVisual: false
  };
  // Crea la GUI
  var gui = new dat.GUI();

  // Aggiungi i controlli 
  var limitValueControl = gui.add(settings, 'limitValue', 0, 50).name('Limit');
  var lightXValueControl = gui.add(settings, 'lightX', -50, 50).name('LightX');
  var lightYValueControl = gui.add(settings, 'lightY', 0, 50).name('LightY');
  var lightZValueControl = gui.add(settings, 'lightZ', -50, 50).name('LightZ');
  var shininessControl = gui.add(settings, 'shininess', 20, 150).name('Shininess');
  var enableShadowsControl = gui.add(settings, 'enableShadows').name('Enable Shadows');
  var staticVisualControl = gui.add(settings, 'staticVisual').name('Static Visual');
  var enableCreditsControl = gui.add(settings, 'enableCredits').name('Credits');
  var buttonControl = gui.add({
    myFunction: function () {
      resetPieces();
      occupiedDeathPositions = [];
      dataID[0] = 99;
      movement = []
      tilesInfo = setTilesInfo();
      for (let i = 0; i < 64; i++) {
        const id = i;
        const pieceTile = "none";
        tilesInfo.push({ id, pieceTile });
      }

    }
  }, 'myFunction').name("Reset")

  // Funzione per aggiornare il valore di limitValue
  function updateLimitValue(value) {
    limitValue = degToRad(value);
  }
  // Funzione per aggiornare il valore di lightX
  function updateLightXValue(value) {
    lightX = value;
  }
  // Funzione per aggiornare il valore di lightY
  function updateLightYValue(value) {
    lightY = value;
  }
  // Funzione per aggiornare il valore di lightZ
  function updateLightZValue(value) {
    lightZ = value;
  }
  // Funzione per aggiornare il valore di shininess
  function updateShininessalue(value) {
    shininess = value;
  }
  // Funzione per aggiornare il valore di shadow
  function updateShadow(value) {
    enableShadows = value;
    //attiva o disattiva le ombre
    if (settings.enableShadows) {
      gl.uniform1f(uniforms.selectShadowLoc, 1.0);
    } else {
      gl.uniform1f(uniforms.selectShadowLoc, 0.0);
    }
  }
  //funzione per mostrare il cubo che gira 
  function updateCredits(value) {
    enableCredits = value;
  }
  //funzione per modificare i controlli della visuale
  function updateVisual(value) {
    px = 7;
    py = 5;
    pz = 20;
    staticVisual = value;
  }
  // Aggiungi un listener per il controllo 
  limitValueControl.onChange(updateLimitValue);
  lightXValueControl.onChange(updateLightXValue);
  lightYValueControl.onChange(updateLightYValue);
  lightZValueControl.onChange(updateLightZValue);
  shininessControl.onChange(updateShininessalue);
  enableShadowsControl.onChange(updateShadow);
  enableCreditsControl.onChange(updateCredits);
  staticVisualControl.onChange(updateVisual);

  //mostra le ombre
  gl.uniform1f(uniforms.selectShadowLoc, 1.0);
  //setto il bias per le ombre
  gl.uniform1f(uniforms.biasLoc, -0.00001);
  const dataID = new Uint8Array(4); // Buffer per leggere i pixel dal frame Buffer
  //setto la pedina selezioanta a 99 (nessuna pedina selezionata)
  dataID[0] = 99;
  let movement = [];
  let pieceSelected = 99;
  //inizializzo il movimento dei pezzi a false
  let movePiece = false;
  let cubeAngle = 0.1;

  //render
  function render(now) {
    now *= 0.001;  // seconds;
    const deltaTime = now - then;
    then = now;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    //creo la matrice camera 
    m4.identity(camera);
    //setto i listner per il mouse
    mouseVisualControl(settings);

    //setto i bottoni per il cellulare 
    const upButton = document.getElementById('up');
    const downButton = document.getElementById('down');
    const rightButton = document.getElementById('right');
    const leftButton = document.getElementById('left');
    //simula il comportamento dei tasti wasd
    upButton.addEventListener('touchstart', () => {
      simulateKeyDown('w')
    });
    upButton.addEventListener('touchend', () => {
      simulateKeyUp('w')
    });
    downButton.addEventListener('touchstart', () => {
      simulateKeyDown('s')
    });
    downButton.addEventListener('touchend', () => {
      simulateKeyUp('s')
    });
    rightButton.addEventListener('touchstart', () => {
      simulateKeyDown('d')
    });
    rightButton.addEventListener('touchend', () => {
      simulateKeyUp('d')
    });
    leftButton.addEventListener('touchstart', () => {
      simulateKeyDown('a')
    });
    leftButton.addEventListener('touchend', () => {
      simulateKeyUp('a')
    });
    //se i tasti w o s sono premuti muove la telecamera, il delta time rappresenta il tempo trascorso dall'ultimo frame 
    if (keys['w'] || keys['s']) {
      const direction = keys['w'] ? 1 : -1;
      
      px -= forward[0] * deltaTime * speed * direction;
      py -= forward[1] * deltaTime * speed * direction;
      pz -= forward[2] * deltaTime * speed * direction;
      // Limiti per pz
      if (pz < -20) {
        pz = -20;
      } else if (pz > 40) {
        pz = 40;
      }
    }

    if (keys['a'] || keys['d']) {
      const direction = keys['a'] ? 1 : -1;
      px -= right[0] * deltaTime * speed * direction;
      py -= right[1] * deltaTime * speed * direction;
      pz -= right[2] * deltaTime * speed * direction;
      if (px < -20) {
        px = -20;
      } else if (px > 30) {
        px = 30;
      }

    }
    //cambio il comportamento della visuale se la checkbox della visuale statica è selezionata
    if (settings.staticVisual == true) {
      m4.lookAt([px, py, pz], [7, 0, 6], [0, 1, 0], camera);
      py += deltaX;
    } else {
      ang += deltaX * 0.5
      // Usa la direzione della telecamera
      targetZ += pz + forward[2];
      m4.lookAt([px, py, pz], [pz, py, -targetZ], [0, 1, 0], camera);
      m4.yRotate(camera, degToRad(-ang), camera);
    }
    // Reset deltaX dopo l'aggiornamento
    deltaX = 0;

    forward = [camera[8], camera[9], camera[10]]; // Aggiorna il vettore forward
    right = [camera[0], camera[1], camera[2]]; // Aggiorna il vettore right

    //se una pedina è selezionata setto il movimento
    if (movePiece == true) {
      var res = setMovement(dataID[0], tilesInfo, pieceSelected, tilePositions);
      movement = res.tilesToMove;
      pieceSelected = res.pieceSelected;

    }
    // setto la posizione della luce
    const lightPosition = [settings.lightX, settings.lightY, settings.lightZ];
    const target = [7, 0, 5]
    const up = [0, 1, 0]
    gl.uniform3fv(uniforms.lightPositionLoc, lightPosition);

    const lightWorldMatrix = m4.lookAt(
      lightPosition,
      target,
      up,
    );

    const lightProjectionMatrix =
      m4.perspective(
        degToRad(25),
        canvas.width / canvas.height,
        0.1,  // near
        100)   // far
    gl.clearColor(0, 0, 0, 1);
    if (settings.enableShadows === true) {
      // disegno sulla depth texture usando il punto di vista della luce
      gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer)
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(colorProgram);
      uniforms = setAttrUniform(colorProgram, gl);

      drawScene(lightProjectionMatrix, lightWorldMatrix, 0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //passo poi la programma principale per ridisegnare la scena sul canvas
    gl.useProgram(mainProgram);
    uniforms = setAttrUniform(mainProgram, gl);
    //setto la texture matrix utilizzata poi per campionare la depth texture
    let textureMatrix = m4.identity();
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);


    textureMatrix = m4.multiply(
      textureMatrix,
      m4.inverse(lightWorldMatrix));
    gl.uniformMatrix4fv(uniforms.textureMatrixLoc, false, textureMatrix);

    //setto la depth texture
    const depthTextureLocation = gl.getUniformLocation(mainProgram, "u_projectedTexture");
    gl.uniform1i(depthTextureLocation, 2);

    gl.enableVertexAttribArray(texcordLoc)
    gl.enableVertexAttribArray(normalLoc)
    //disegno la scena proiettando la depth texture
    drawScene(projection, camera, 1);

    // setto lo shininess
    const shininess = settings.shininess;
    gl.uniform1f(uniforms.shininessLoc, shininess);
    //setto le varie uniform per la direzione, posizione e limit per la luce 
  
    var lightDirection = [-lightWorldMatrix[8], -lightWorldMatrix[9], -lightWorldMatrix[10]];
    gl.uniform3fv(uniforms.lightPositionLoc, lightPosition);
    gl.uniform3fv(uniforms.viewWorldPositionLoc, [px, py, pz]);
    var limit = degToRad(settings.limitValue);
    gl.uniform3fv(uniforms.lightDirectionLoc, lightDirection);
    gl.uniform1f(uniforms.limitLoc, Math.cos(limit));
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);


  function drawScene(projMatrix, cameraMatrix, progSelect) {
    // Calcola la matrice di vista
    m4.inverse(cameraMatrix, view);
    gl.uniformMatrix4fv(uniforms.viewLoc, false, view);

    gl.uniformMatrix4fv(uniforms.projectionLoc, false, projMatrix);

    drawTiles(progSelect);
    drawDeathTiles(progSelect)
    //collego i pezzi ai tasselli
    for (let i = 0; i < piecePositions.length; i++) {

      for (let j = 0; j < tilePositions.length; j++) {
        if (tilePositions[j].x === piecePositions[i].x && tilePositions[j].z === piecePositions[i].z) {
          tilesInfo[j].pieceTile = piecePositions[i].id
        }
      }

      //disegno i pezzi
      drawPiece(piecePositions[i].dataIndex, piecePositions[i].x, piecePositions[i].z, piecePositions[i].textureIndex, progSelect);
    }
    //disegno il cubo
    if (settings.enableCredits) {
      cubeAngle += 0.1;
      drawCube(progSelect, cubeAngle)
    }
    //disegno il tavolo
    drawTable(progSelect)

    //disegna le stelle
    drawStar(progSelect)
  }
  function drawTiles(progSelect) {
    // Disegna i tasselli
    for (let i = 0; i < tilePositions.length; i++) {
      m4.identity(model)
      // Imposta la matrice del modello per ogni tassello
      const modelTranslation = m4.translation(tilePositions[i].x, 0, tilePositions[i].z);
      m4.multiply(modelTranslation, model, model);

      gl.uniformMatrix4fv(uniforms.modelLoc, false, model);
      // Determina il colore o la texture in base alla posizione
      const row = Math.floor(i / 8);
      const col = i % 8;
      if (progSelect == 1) {


        if ((row + col) % 2 === 0) {
          // Attiva la texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture1);
          // Imposta l'uniform per la texture
          gl.uniform1i(uniforms.textureLoc, 0);

        } else {
          // Attiva la texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture2);
          // Imposta l'uniform per la texture
          gl.uniform1i(uniforms.textureLoc, 0);
        }

        if (dataID[0] === i) {
          // Attiva la texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture5);
          // Imposta l'uniform per la texture
          gl.uniform1i(uniforms.textureLoc, 0);
        }

        movement.forEach((element) => {
          if (element === i) {
            // Attiva la texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture6);
            // Imposta l'uniform per la texture
            gl.uniform1i(uniforms.textureLoc, 0);
          }
        });
        // Calcola il colore unico per l'indice della casella
        const color = [i / 255, 0, 0, 1]; // Colore basato sull'indice
        gl.uniform4fv(uniforms.idTilesLoc, color);


        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersNorm); // Usa il buffer per le normali
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersTex); // Usa il buffer per le coordinate di texture
        gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);


        // Collega e imposta gli attributi dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersPos); // Usa il buffer per la posizione
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.uniform4fv(uniforms.uColorLoc, [1, 0, 1, 1]);
        gl.disableVertexAttribArray(texcordLoc)
        gl.disableVertexAttribArray(normalLoc)
        // Collega e imposta gli attributi dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersPos); // Usa il buffer per la posizione
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      }
      // Disegna il tassello
      gl.drawArrays(gl.TRIANGLES, 0, data.faces[0].positions.length / 3);

    }

  }

  function drawPiece(pieceIndex, x, z, textureIndex, progSelect) {
    m4.identity(model);
    const modelTranslation = m4.translation(x, 0, z); // Posiziona il pezzo
    m4.multiply(modelTranslation, model, model);

    // Imposta le matrici uniformi
    gl.uniformMatrix4fv(uniforms.modelLoc, false, model);
    if (progSelect == 1) {
      if (textureIndex == 2) {
        // Attiva la texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture3);
        // Imposta l'uniform per la texture
        gl.uniform1i(uniforms.textureLoc, 0);
      } else {

        // Attiva la texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture4);
        // Imposta l'uniform per la texture
        gl.uniform1i(uniforms.textureLoc, 0);

      }

      gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesNorm[pieceIndex]);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesTex[pieceIndex]);
      gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);
      // Collega e imposta gli attributi dei vertici
    } else {
      gl.uniform4fv(uniforms.uColorLoc, [0, 0, 1, 1]);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferOfPiecesPos[pieceIndex]);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    // Disegna il pezzo
    gl.drawArrays(gl.TRIANGLES, 0, dataPieces[pieceIndex].faces[0].positions.length / 3);
  }


  function drawDeathTiles(progSelect) {
    // Disegna i tasselli
    for (let i = 0; i < tileDeathPositions.length; i++) {
      m4.identity(model)
      // Imposta la matrice del modello per ogni tassello
      const modelTranslation = m4.translation(tileDeathPositions[i].x, 0, tileDeathPositions[i].z);
      m4.multiply(modelTranslation, model, model);

      // Imposta le matrici uniformi
      gl.uniformMatrix4fv(uniforms.modelLoc, false, model);
      // Determina il colore o la texture in base alla posizione
      const row = Math.floor(i / 8);
      const col = i % 8;
      if (progSelect == 1) {


        if ((row + col) % 2 === 0) {
          // Attiva la texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture1);
          // Imposta l'uniform per la texture
          gl.uniform1i(uniforms.textureLoc, 0);

        } else {
          // Attiva la texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture2);
          // Imposta l'uniform per la texture
          gl.uniform1i(uniforms.textureLoc, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersNorm); // Usa il buffer per le normali
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersTex); // Usa il buffer per le coordinate di texture
        gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);


        // Collega e imposta gli attributi dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersPos); // Usa il buffer per la posizione
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.uniform4fv(uniforms.uColorLoc, [1, 0, 1, 1]);

        gl.disableVertexAttribArray(texcordLoc)
        gl.disableVertexAttribArray(normalLoc)
        // Collega e imposta gli attributi dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayOfBuffersPos); // Usa il buffer per la posizione
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      }
      // Disegna il tassello
      gl.drawArrays(gl.TRIANGLES, 0, data.faces[0].positions.length / 3);

    }

  }

  function drawCube(progSelect, angle) {
    m4.identity(model)
    // Imposta la matrice del modello per ogni tassello
    const modelTranslation = m4.translation(7, 5, 7);
    m4.yRotate(model, degToRad(angle), model);
    m4.multiply(modelTranslation, model, model);
    gl.uniformMatrix4fv(uniforms.modelLoc, false, model);

    const modelInverse = m4.inverse(model);

    // Calcola la trasposta della matrice inversa per ricalcolare le normali della rotazione del cubo
    const normalMatrix = m4.identity();
    m4.transpose(modelInverse, normalMatrix);
    gl.uniformMatrix4fv(uniforms.normalMatrixLoc, false, normalMatrix);
    for (let i = 0; i < cubePos.length; i++) {
      // Imposta le matrici uniformi

      if (progSelect == 1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeNorm[i]); // Usa il buffer per le normali
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeTex[i]); // Usa il buffer per le coordinate di texture
        gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture7);
        // Imposta l'uniform per la texture
        gl.uniform1i(uniforms.textureLoc, 0);
      }



      // Collega e imposta gli attributi dei vertici
      gl.bindBuffer(gl.ARRAY_BUFFER, cubePos[i]); // Usa il buffer per la posizione
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, dataCube.faces[i].positions.length / 3);
    }
    //resetto normalMatrix così da non influenzare gli altri oggetti
    gl.uniformMatrix4fv(uniforms.normalMatrixLoc, false, m4.identity());
  }

  function drawTable(progSelect) {
    m4.identity(model);

    // Imposta la matrice del modello per ogni tassello
    const modelScale = m4.scaling(0.7, 0, 0.7);
    const modelTranslation = m4.translation(7, 0, 7);

    // Moltiplica prima la scala e poi la traslazione
    m4.multiply(modelScale, model, model);
    m4.multiply(modelTranslation, model, model);

    // Invia la matrice del modello al shader
    gl.uniformMatrix4fv(uniforms.modelLoc, false, model);
    for (let i = 0; i < tablePos.length; i++) {
      if (progSelect == 1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, tableNorm[i]); // Usa il buffer per le normali
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, tableTex[i]); // Usa il buffer per le coordinate di texture
        gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture8);
        // Imposta l'uniform per la texture
        gl.uniform1i(uniforms.textureLoc, 0);
      }

      // Collega e imposta gli attributi dei vertici
      gl.bindBuffer(gl.ARRAY_BUFFER, tablePos[i]); // Usa il buffer per la posizione
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, dataTable.faces[i].positions.length / 3);
    }

  }

  function drawStar(progSelect) {
    //disabilito il cullface così da mostrare anche le texture interne alla sfera
    gl.disable(gl.CULL_FACE);
    if (progSelect === 1) {
      m4.identity(model);
      const modelScale = m4.scaling(10, 10, 10);
      const modelTranslation = m4.translation(7, 0, 7);

      m4.multiply(modelScale, model, model);
      m4.multiply(modelTranslation, model, model);
      gl.uniformMatrix4fv(uniforms.modelLoc, false, model);

      gl.bindBuffer(gl.ARRAY_BUFFER, sphereNorm); // Usa il buffer per le normali
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sphereTex); // Usa il buffer per le coordinate di texture
      gl.vertexAttribPointer(texcordLoc, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture9);
      // Imposta l'uniform per la texture
      gl.uniform1i(uniforms.textureLoc, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, spherePos); // Usa il buffer per la posizione
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.sphereLoc, 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, dataSphere.faces[0].positions.length / 3);

      gl.uniform1f(uniforms.sphereLoc, 0.0);
    }
    gl.enable(gl.CULL_FACE);
  }

  const mousePosition = { x: 0, y: 0 };
  canvas.addEventListener('mousedown', (evt) => {

    if (evt.button === 0) {
      mousePosition.x = evt.offsetX;
      mousePosition.y = canvas.height - evt.offsetY;
      //disegno sul frame buffer la scacchiera, dopodichè leggo i pixel ed estraggo l'identificativo univoco 
      //associato alla casella della scacchiera
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      // Pulisce il buffer di colore
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.selectLoc, 1.0);
      drawTiles(1);

      gl.readPixels(
        mousePosition.x, mousePosition.y, 1, 1,
        gl.RGBA,
        gl.UNSIGNED_BYTE, //Utilizzato per rappresentare ciascuna componente (R, G, B, A) come un valore intero senza segno compreso tra 0 e 255
        dataID
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      console.log("dataId", dataID[0])
      if (movePiece === true) {
        movement.forEach(element => {
          if (element === dataID[0]) {
            let oldTile = 0;
            //si aggiorna la posizione
            piecePositions[pieceSelected].x = tilePositions[dataID[0]].x;
            piecePositions[pieceSelected].z = tilePositions[dataID[0]].z;
            //prendo l'id della vecchia casella
            tilesInfo.forEach(element => {
              if (element.pieceTile === pieceSelected) {
                oldTile = element.id
              }

            });
            //setto a none la vecchia casella
            tilesInfo[oldTile].pieceTile = "none";
            //se il pezzo mosso è un pedone setto init a 0
            if (piecePositions[pieceSelected].type == "pedone") {
              piecePositions[pieceSelected].init = 0;
            }
            //controllo se c'è un'altra pedina e mangio
            if (tilesInfo[dataID[0]].pieceTile != "none") {
              enemyId = tilesInfo[dataID[0]].pieceTile;
              oldx = piecePositions[enemyId].x
              oldz = piecePositions[enemyId].z
              deathpositions = calculateDethPosition(tileDeathPositions, piecePositions[enemyId].color);
              piecePositions[enemyId].x = deathpositions.x
              piecePositions[enemyId].z = deathpositions.z;
            }
            //termino il movimento
            dataID[0] = 99;
            movePiece = false;
            movement = [];
            pieceSelected = 99;
          }
        });
        //se clicco su una casella che non fa parte del movimento della pedina (se movePiece è ancora true) resetto il movimento
        if (movePiece === true) {
          dataID[0] = 99;
          movePiece = false;
          movement = [];
          pieceSelected = 99;
        }
      } else {
        if (tilesInfo[dataID[0]].pieceTile != "none")
          movePiece = true;

      }

      gl.uniform1f(uniforms.selectLoc, 0.0);
    }

  });

}

main();