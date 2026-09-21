import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

let gameOver = false;

//score
let score = 0;
const scoreMessage = document.createElement("div");
scoreMessage.textContent = "Score: " + score + " / 10";
scoreMessage.style.position = "fixed";
scoreMessage.style.top = "24px";
scoreMessage.style.left = "24px";
scoreMessage.style.fontFamily = "sans-serif";
scoreMessage.style.fontSize = "28px";
scoreMessage.style.fontWeight = "bold";
scoreMessage.style.color = "#ffffff";
scoreMessage.style.textShadow = "2px 2px 4px #000000";
scoreMessage.style.display = "block";
scoreMessage.style.zIndex = "1";
document.body.appendChild(scoreMessage);



// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const collisionMessage = document.createElement("div");
collisionMessage.textContent = "Collision is happening!";
collisionMessage.style.position = "fixed";
collisionMessage.style.top = "24px";
collisionMessage.style.left = "50%";
collisionMessage.style.transform = "translateX(-50%)";
collisionMessage.style.fontFamily = "sans-serif";
collisionMessage.style.fontSize = "28px";
collisionMessage.style.fontWeight = "bold";
collisionMessage.style.color = "#ffffff";
collisionMessage.style.textShadow = "2px 2px 4px #000000";
collisionMessage.style.display = "none";
collisionMessage.style.zIndex = "1";
document.body.appendChild(collisionMessage);

const timerMessage = document.createElement("div");
timerMessage.style.position = "fixed";
timerMessage.style.top = "24px";
timerMessage.style.right = "24px";
timerMessage.style.fontFamily = "sans-serif";
timerMessage.style.fontSize = "24px";
timerMessage.style.fontWeight = "bold";
timerMessage.style.color = "#ffffff";
timerMessage.style.textShadow = "2px 2px 4px #000000";
timerMessage.style.zIndex = "1";
document.body.appendChild(timerMessage);

// Ground Plane
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x44aa44
});

const plane = new THREE.Mesh(
    planeGeometry,
    planeMaterial
);

plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Lights
const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.6
);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    1
);

directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Player Cube
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000ff
});

const player = new THREE.Mesh(
    cubeGeometry,
    cubeMaterial
);

player.position.y = 0.5;
scene.add(player);


const obstacles = [];

function spawnObstacle() {
    for (let i = 0; i < 20; i++) {
    const obstacleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const obstacleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000
    });

    const obstacle = new THREE.Mesh(
        obstacleGeometry,
        obstacleMaterial
    );
    obstacle.position.x = (Math.random() - 0.5) * 20;
    obstacle.position.y = 12;
    obstacle.position.z = (Math.random() - 0.5) * 20;
    obstacles.push(obstacle);
    scene.add(obstacle);
}
}

spawnObstacle();

const targetObject = obstacles[obstacles.length - 1];

function placeObjects(objects) {
    const objectPositions = [];

    while (objectPositions.length < objects.length) {
        const position = [
            Math.random() * 12 - 6,
            1,
            Math.random() * 12 - 6
        ];
        const isFarEnoughFromPlayer = Math.hypot(position[0], position[2]) > 2.5;
        const isFarEnoughFromObjects = objectPositions.every((otherPosition) =>
            Math.hypot(
                position[0] - otherPosition[0],
                position[2] - otherPosition[2]
            ) > 2.5
        );

        if (isFarEnoughFromPlayer && isFarEnoughFromObjects) {
            objectPositions.push(position);
        }
    }

    objects.forEach((object, index) => {
        object.position.set(...objectPositions[index]);
        scene.add(object);
    });
}


// Keyboard State Object
const keys = {};

// Key Down
window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

// Key Up
window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// Movement Speed
const speed = 0.1;
const playerBounds = new THREE.Box3();
const objectBounds = new THREE.Box3();
let collisionTime = 0;
let targetFound = false;
const gameStartTime = performance.now();
const gameDuration = 20;

function updateTimerMessage(secondsRemaining) {
    if (secondsRemaining === 0) {
        gameOver = true;
        timerMessage.textContent = "GAME OVER!";
        timerMessage.style.top = "50%";
        timerMessage.style.right = "auto";
        timerMessage.style.left = "50%";
        timerMessage.style.transform = "translate(-50%, -50%)";
        timerMessage.style.width = "100%";
        timerMessage.style.textAlign = "center";
        timerMessage.style.fontSize = "15vw";
        timerMessage.style.color = "#ff3333";
    } else {
        timerMessage.textContent = `Time: ${secondsRemaining}`;
    }
}

function updateTimer() {
    const elapsedSeconds = Math.floor((performance.now() - gameStartTime) / 1000);
    const secondsRemaining = Math.max(gameDuration - elapsedSeconds, 0);
    updateTimerMessage(secondsRemaining);
}

function updateCollisionMessage(isColliding) {
    if (isColliding) {
        collisionMessage.textContent = "GAME OVER!";
        collisionMessage.style.display = "block";
        collisionMessage.style.color = "#ff3333";
    }
}

function handleCollisions() {
    playerBounds.setFromObject(player);
    let isColliding = false;

    obstacles.forEach((object) => {
        if (object.userData.collected) {
            return;
        }

        objectBounds.setFromObject(object);
        const objectIsColliding = playerBounds.intersectsBox(objectBounds);

        if (objectIsColliding) {
            isColliding = true;
            object.userData.collected = true;
            object.visible = false;
            gameOver = true;
        } else {
            object.visible = true;
        }
    });

    updateCollisionMessage(isColliding);
}

// Animation Loop
function animate() {

    requestAnimationFrame(animate);

    updateTimer();

    obstacles.forEach((obstacle) => {
        obstacle.position.y -= 0.05;
    });
    if (!gameOver) {
        // WASD Controls
        if (keys["w"]) {
            player.position.z -= speed;
        }

        if (keys["s"]) {
            player.position.z += speed;
        }

        if (keys["a"]) {
            player.position.x -= speed;
        }

        if (keys["d"]) {
            player.position.x += speed;
        }

        // Arrow Key Controls
        if (keys["arrowup"]) {
            player.position.z -= speed;
        }

        if (keys["arrowdown"]) {
            player.position.z += speed;
        }

        if (keys["arrowleft"]) {
            player.position.x -= speed;
        }

        if (keys["arrowright"]) {
            player.position.x += speed;
        }
    }

    handleCollisions();

    renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
