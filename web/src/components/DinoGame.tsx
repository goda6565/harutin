import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./DinoGame.module.css";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 150;
const GROUND_Y = 120;
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const GAME_SPEED_INITIAL = 6;

// Dino
const DINO_WIDTH = 44;
const DINO_HEIGHT = 47;
const DINO_X = 50;

// Cactus
const CACTUS_WIDTH = 25;
const CACTUS_HEIGHT = 50;

type Obstacle = { x: number; width: number; height: number; passed: boolean };
type Cloud = { x: number; y: number };

function drawDino(
	ctx: CanvasRenderingContext2D,
	y: number,
	isJumping: boolean,
	frame: number,
) {
	ctx.fillStyle = "#535353";
	// Body
	ctx.fillRect(DINO_X + 15, y + 5, 20, 25);
	// Head
	ctx.fillRect(DINO_X + 25, y, 19, 20);
	// Eye (white)
	ctx.fillStyle = "#fff";
	ctx.fillRect(DINO_X + 38, y + 4, 4, 4);
	// Tail
	ctx.fillStyle = "#535353";
	ctx.fillRect(DINO_X, y + 10, 15, 8);
	// Legs (animated)
	if (isJumping) {
		ctx.fillRect(DINO_X + 18, y + 30, 6, 17);
		ctx.fillRect(DINO_X + 28, y + 30, 6, 17);
	} else {
		const legOffset = frame % 2 === 0;
		ctx.fillRect(DINO_X + 18, y + 30, 6, legOffset ? 17 : 12);
		ctx.fillRect(DINO_X + 28, y + 30, 6, legOffset ? 12 : 17);
	}
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, height: number) {
	ctx.fillStyle = "#535353";
	const baseY = GROUND_Y - height;
	// Main stem
	ctx.fillRect(x + 8, baseY, 10, height);
	// Left arm
	ctx.fillRect(x, baseY + 15, 8, 6);
	ctx.fillRect(x, baseY + 10, 6, 10);
	// Right arm
	ctx.fillRect(x + 18, baseY + 20, 7, 6);
	ctx.fillRect(x + 20, baseY + 15, 5, 10);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
	ctx.fillStyle = "#d3d3d3";
	ctx.fillRect(x, y, 30, 10);
	ctx.fillRect(x + 5, y - 5, 20, 8);
	ctx.fillRect(x + 10, y + 8, 15, 5);
}

export default function DinoGame() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [gameOver, setGameOver] = useState(false);
	const [score, setScore] = useState(0);
	const [highScore, setHighScore] = useState(0);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dinoY = useRef(GROUND_Y - DINO_HEIGHT);
	const dinoVelocity = useRef(0);
	const isJumping = useRef(false);
	const obstacles = useRef<Obstacle[]>([]);
	const clouds = useRef<Cloud[]>([]);
	const gameSpeed = useRef(GAME_SPEED_INITIAL);
	const frameCount = useRef(0);
	const animationId = useRef<number>(0);
	const dinoFrame = useRef(0);

	const jump = useCallback(() => {
		if (!isJumping.current && isPlaying && !gameOver) {
			dinoVelocity.current = JUMP_FORCE;
			isJumping.current = true;
		}
	}, [isPlaying, gameOver]);

	const startGame = useCallback(() => {
		dinoY.current = GROUND_Y - DINO_HEIGHT;
		dinoVelocity.current = 0;
		isJumping.current = false;
		obstacles.current = [];
		clouds.current = [
			{ x: 100, y: 30 },
			{ x: 300, y: 20 },
			{ x: 500, y: 40 },
		];
		gameSpeed.current = GAME_SPEED_INITIAL;
		frameCount.current = 0;
		setScore(0);
		setGameOver(false);
		setIsPlaying(true);
	}, []);

	const gameLoop = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear
		ctx.fillStyle = "#f7f7f7";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Clouds
		for (const cloud of clouds.current) {
			cloud.x -= gameSpeed.current * 0.2;
			if (cloud.x < -50) {
				cloud.x = canvas.width + Math.random() * 100;
				cloud.y = 20 + Math.random() * 30;
			}
			drawCloud(ctx, cloud.x, cloud.y);
		}

		// Ground line
		ctx.fillStyle = "#535353";
		ctx.fillRect(0, GROUND_Y, canvas.width, 1);

		// Ground texture
		for (let i = 0; i < canvas.width; i += 20) {
			if (Math.random() > 0.7) {
				ctx.fillRect(i, GROUND_Y + 3, 2, 2);
			}
		}

		// Dino physics
		dinoVelocity.current += GRAVITY;
		dinoY.current += dinoVelocity.current;

		if (dinoY.current >= GROUND_Y - DINO_HEIGHT) {
			dinoY.current = GROUND_Y - DINO_HEIGHT;
			dinoVelocity.current = 0;
			isJumping.current = false;
		}

		// Animate dino legs
		frameCount.current++;
		if (frameCount.current % 6 === 0) {
			dinoFrame.current++;
		}

		// Draw dino
		drawDino(ctx, dinoY.current, isJumping.current, dinoFrame.current);

		// Spawn obstacles
		if (frameCount.current % Math.floor(80 + Math.random() * 40) === 0) {
			const height = CACTUS_HEIGHT + Math.random() * 15;
			obstacles.current.push({
				x: canvas.width,
				width: CACTUS_WIDTH,
				height,
				passed: false,
			});
		}

		// Update and draw obstacles
		for (let i = obstacles.current.length - 1; i >= 0; i--) {
			const obs = obstacles.current[i];
			obs.x -= gameSpeed.current;

			drawCactus(ctx, obs.x, obs.height);

			// Collision (with padding for fairness)
			const dinoBox = {
				x: DINO_X + 10,
				y: dinoY.current + 5,
				w: DINO_WIDTH - 20,
				h: DINO_HEIGHT - 10,
			};
			const obsBox = {
				x: obs.x + 5,
				y: GROUND_Y - obs.height,
				w: obs.width - 10,
				h: obs.height - 5,
			};

			if (
				dinoBox.x < obsBox.x + obsBox.w &&
				dinoBox.x + dinoBox.w > obsBox.x &&
				dinoBox.y < obsBox.y + obsBox.h &&
				dinoBox.y + dinoBox.h > obsBox.y
			) {
				setGameOver(true);
				setIsPlaying(false);
				setHighScore((prev) => Math.max(prev, score));
				return;
			}

			// Score
			if (!obs.passed && obs.x + obs.width < DINO_X) {
				obs.passed = true;
				setScore((s) => s + 1);
			}

			// Remove off-screen
			if (obs.x < -obs.width) {
				obstacles.current.splice(i, 1);
			}
		}

		// Increase speed
		if (frameCount.current % 500 === 0) {
			gameSpeed.current += 0.3;
		}

		animationId.current = requestAnimationFrame(gameLoop);
	}, [score]);

	useEffect(() => {
		if (isPlaying && !gameOver) {
			animationId.current = requestAnimationFrame(gameLoop);
		}
		return () => cancelAnimationFrame(animationId.current);
	}, [isPlaying, gameOver, gameLoop]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space" || e.code === "ArrowUp") {
				e.preventDefault();
				if (!isPlaying || gameOver) {
					startGame();
				} else {
					jump();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isPlaying, gameOver, jump, startGame]);

	const handleClick = () => {
		if (!isPlaying || gameOver) {
			startGame();
		} else {
			jump();
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.scoreBoard}>
				<span>HI {String(highScore).padStart(5, "0")}</span>
				<span>{String(score).padStart(5, "0")}</span>
			</div>
			<canvas
				ref={canvasRef}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				className={styles.canvas}
				onClick={handleClick}
			/>
			{!isPlaying && (
				<div className={styles.overlay}>
					{gameOver ? (
						<div className={styles.gameOver}>
							<div className={styles.gameOverIcon}>GAME OVER</div>
							<button
								type="button"
								onClick={startGame}
								className={styles.restartBtn}
							>
								↻
							</button>
						</div>
					) : (
						<p className={styles.startText}>Press Space or Click to Start</p>
					)}
				</div>
			)}
		</div>
	);
}
