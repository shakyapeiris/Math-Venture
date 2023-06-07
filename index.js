const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const questionBox = document.getElementById('question');
const answersBox = document.getElementById('answers');

const GAME_STATES = {
	LOST: 'lost',
	WON: 'won',
	PLAYING: 'playing',
};

class Question {
	constructor({ question, answers, answer }) {
		this.question = question;
		this.answers = answers;
		this.answer = answer;
	}

	isCorrect(answerId) {
		const ans = this.answers.find((a) => a.id == answerId);
		if (ans) return true;

		return false;
	}
}

class Player {
	constructor({ coordinates, velocity, radius, angularVelocity, angle }) {
		this.coordinates = coordinates;
		this.velocity = velocity;
		this.radius = radius;
		this.angularVelocity = angularVelocity;
		this.angle = angle;
	}
	rotateRight() {
		if (this.angle + this.angularVelocity < Math.PI / 2)
			this.angle += this.angularVelocity;
	}
	rotateLeft() {
		if (this.angle - this.angularVelocity > -(Math.PI / 2))
			this.angle -= this.angularVelocity;
	}
	draw() {
		ctx.translate(this.coordinates.x, this.coordinates.y);
		ctx.rotate(this.angle);
		ctx.translate(-this.coordinates.x, -this.coordinates.y);
		ctx.fillStyle = 'red';
		ctx.fillRect(this.coordinates.x - 10, this.coordinates.y - 70, 20, 70);
		ctx.resetTransform();

		ctx.beginPath();
		ctx.fillStyle = 'green';
		ctx.strokeStyle = 'green';
		ctx.arc(
			this.coordinates.x,
			this.coordinates.y,
			this.radius,
			-Math.PI,
			0
		);
		// ctx.rotate(this.angle);
		ctx.stroke();
		ctx.fill();
	}
}

class Enemy {
	constructor({ coordinates, velocity, sprite, text, answerId }) {
		this.coordinates = coordinates;
		this.velocity = velocity;
		this.sprite = sprite;
		this.text = text;
		this.answerId = answerId;
	}
	draw() {
		this.coordinates.y += this.velocity.y;
		// const img = new Image();
		// img.src = './enemy.png';
		// console.log(img);
		// img.onload = () => {
		// 	ctx.drawImage(
		// 		img,
		// 		this.coordinates.x,
		// 		this.coordinates.y,
		// 		100,
		// 		100
		// 	);
		// };
		ctx.fillStyle = 'orange';

		ctx.fillRect(this.coordinates.x, this.coordinates.y, 50, 50);
		ctx.font = '30px Arial';
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		if (this.text)
			ctx.fillText(
				this.text,
				this.coordinates.x + 25,
				this.coordinates.y + 35
			);
	}
}

class Particle {
	constructor({
		coordinates,
		velocity,
		radius,
		opacity,
		opacityChange,
		color,
		scale,
	}) {
		this.coordinates = coordinates;
		this.velocity = velocity;
		this.radius = radius;
		this.opacity = opacity;
		this.opacityChange = opacityChange;
		this.color = color;
		this.scale = scale;
	}
	draw() {
		this.coordinates.y += this.velocity.y;
		this.coordinates.x += this.velocity.x;
		if (this.opacityChange > 0) this.opacity *= this.opacityChange;
		console.log(this.opacity);
		this.radius *= this.scale;
		ctx.beginPath();
		ctx.globalAlpha = this.opacity;
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		ctx.arc(
			this.coordinates.x,
			this.coordinates.y,
			this.radius,
			0,
			Math.PI * 2
		);
		ctx.stroke();
		ctx.fill();
		ctx.globalAlpha = 1;
	}
}

class Projectile {
	constructor({ coordinates, velocity, radius }) {
		this.coordinates = coordinates;
		this.velocity = velocity;
		this.radius = radius;
	}
	draw() {
		this.coordinates.y -= this.velocity.y;
		this.coordinates.x += this.velocity.x;
		ctx.beginPath();
		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'red';
		ctx.arc(
			this.coordinates.x,
			this.coordinates.y,
			this.radius,
			0,
			Math.PI * 2
		);
		ctx.stroke();
		ctx.fill();
	}
}

const player = new Player({
	coordinates: {
		x: 500,
		y: canvas.height,
	},
	velocity: {
		x: 10,
		y: 10,
	},
	radius: 40,
	angularVelocity: Math.PI / 24,
	angle: 0,
});

let enemies = [];
const projectiles = [];
const particles = [];
const questions = [
	new Question({
		question: 'What is the derivate of sin(x)',
		answers: [
			{ id: 0, txt: 'cos(x)' },
			{ id: 1, txt: 'sec(x)' },
			{ id: 2, txt: 'tan(x)' },
			{ id: 3, txt: 'cot(x)' },
		],
		answer: 0,
	}),
	new Question({
		question: 'What is the derivative of cos(x)?',
		answers: [
			{ id: 0, txt: 'sec(x)' },
			{ id: 1, txt: 'tan(x)' },
			{ id: 2, txt: '-sin(x)' },
			{ id: 3, txt: 'cot(x)' },
		],
		answer: 2,
	}),
];

questionBox.innerHTML = questions[0].question;

questions[0].answers.forEach((ans, index) => {
	answersBox.innerHTML += `<li>${index + 1}) ${ans.txt}</li>`;
});

let particleCount = 0;
let enemyTimer = 0;
let qIndex = 0;
let score = 0;
let hp = 2;
let GAME_STATE = GAME_STATES.PLAYING;

for (let i = 0; i < 4; i++) {
	enemies.push(
		new Enemy({
			coordinates: {
				x: Math.floor(Math.random() * (canvas.width - 50)),
				y: Math.floor(Math.random() * 10) - 5,
			},
			velocity: {
				x: 0,
				y: Math.random(),
			},
			text: i + 1,
		})
	);
}

const changeQuestion = () => {
	hp = 2;
	qIndex++;
	if (qIndex == questions.length) {
		qIndex = 0;
	}
	questionBox.innerText = questions[qIndex].question;

	answersBox.innerHTML = '';
	questions[qIndex].answers.forEach((ans, index) => {
		answersBox.innerHTML += `<li>${index + 1}) ${ans.txt}</li>`;
	});
	document.getElementById('hp').innerText = hp;
	enemies = [];
	for (let i = 0; i < 4; i++) {
		enemies.push(
			new Enemy({
				coordinates: {
					x: Math.floor(Math.random() * (canvas.width - 50)),
					y: Math.floor(Math.random() * 10) - 5,
				},
				velocity: {
					x: 0,
					y: Math.random(),
				},
				text: i + 1,
			})
		);
	}
};

function animate() {
	const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
	gradient.addColorStop(0, '#736CC0');
	gradient.addColorStop(1, '#2B2668');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	particleCount++;
	if (particleCount % 5 == 0) {
		particles.push(
			new Particle({
				coordinates: {
					x: Math.floor(Math.random() * canvas.width),
					y: Math.floor(Math.random() * 10) - 5,
				},
				velocity: {
					x: 0,
					y: Math.random(),
				},
				radius: Math.random() + 1,
				opacity: Math.random(),
				opacityChange: 0,
				color: 'white',
				scale: 1,
			})
		);
	}

	projectiles.forEach((projectile, i) => {
		enemies.forEach((enemy, index) => {
			console.log(enemy);
			if (
				projectile.coordinates.x >= enemy.coordinates.x - 3 &&
				projectile.coordinates.x <= enemy.coordinates.x + 53 &&
				projectile.coordinates.y >= enemy.coordinates.y + 3 &&
				projectile.coordinates.y <= enemy.coordinates.y + 53
			) {
				enemies.splice(index, 1);
				projectiles.splice(i, 1);
				if (enemy.text - 1 == questions[qIndex].answer && hp > 0) {
					score++;
					document.getElementById('score').innerText = score;
					changeQuestion();
				} else {
					hp--;
					document.getElementById('hp').innerText = hp;
				}
				for (let i = 0; i < 10; i++) {
					particles.push(
						new Particle({
							coordinates: {
								x: enemy.coordinates.x + 25,
								y: enemy.coordinates.y + 25,
							},
							velocity: {
								x: Math.random() * 5 - 2.5,
								y: Math.random() * 5 - 2.5,
							},
							opacity: 1,
							radius: Math.floor(Math.random() * 20),
							opacity: Math.random(),
							opacityChange: 0.97,
							color: 'orange',
							scale: 0.95,
						})
					);
				}
			}
		});
	});
	if (hp == 0) {
		GAME_STATE = GAME_STATES.LOST;
		// When two or more options were gone
	}
	particles.forEach((particle) => particle.draw());
	projectiles.forEach((projectile, index) => {
		if (
			projectile.coordinates.x > 0 &&
			projectile.coordinates.x < canvas.width &&
			projectile.coordinates.y > 0 &&
			projectile.coordinates.y < canvas.height
		)
			projectile.draw();
		else projectiles.splice(index, 1);
	});
	enemies.forEach((enemy, index) => {
		if (enemy.coordinates.y < canvas.height) enemy.draw();
		else {
			if (enemy.text - 1 == questions[qIndex].answer) {
				GAME_STATE = GAME_STATES.LOST;
				hp = 0;
				document.getElementById('hp').innerText = hp;
			} else {
				if (hp > 0) hp--;
				document.getElementById('hp').innerText = hp;
			}
			enemies.splice(index, 1);
		}
	});
	particles.forEach((particle, index) => {
		if (particle.coordinates.y < canvas.height && particle.radius > 0.1)
			particle.draw();
		else particles.splice(index, 1);
	});
	enemies.forEach((enemy) => {
		enemy.draw();
	});
	player.draw();
	enemyTimer++;

	if (GAME_STATE == GAME_STATES.LOST) {
		ctx.font = '100px Arial';
		ctx.fillStyle = 'orange';
		ctx.textAlign = 'center';
		ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
	}

	requestAnimationFrame(animate);
}

for (let i = 0; i < 100; i++) {
	particles.push(
		new Particle({
			coordinates: {
				x: Math.floor(Math.random() * canvas.width),
				y: Math.floor(Math.random() * canvas.height),
			},
			velocity: {
				x: 0,
				y: Math.random(),
			},
			radius: Math.random() + 1,
			opacity: Math.random(),
			opacityChange: 0,
			color: 'white',
			scale: 1,
		})
	);
}
document.getElementById('score').innerHTML = score;
document.getElementById('hp').innerHTML = hp;
animate();

window.addEventListener('keydown', (e) => {
	console.log(e.code);
	switch (e.code) {
		case 'Space':
			if (hp > 0) {
				projectiles.push(
					new Projectile({
						coordinates: {
							x:
								player.coordinates.x +
								70 * Math.sin(player.angle),
							y:
								player.coordinates.y -
								70 * Math.cos(player.angle),
						},
						velocity: {
							x: 10 * Math.sin(player.angle),
							y: 10 * Math.cos(player.angle),
						},
						radius: 3,
					})
				);
				console.log(projectiles);
			}
			break;
		case 'KeyA':
			player.rotateLeft();
			console.log(player);
			break;
		case 'KeyD':
			player.rotateRight();
			console.log(player);
			break;
		default:
			break;
	}
});
