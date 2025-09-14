class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏配置
        this.gridSize = 20;
        this.speed = 150;
        this.scorePerFood = 10;
        
        // 游戏状态
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // DOM元素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 移动设备控制按钮
        this.upBtn = document.getElementById('upBtn');
        this.downBtn = document.getElementById('downBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        
        this.init();
    }
    
    init() {
        // 初始化游戏
        this.setupEventListeners();
        this.resetGame();
        this.updateDisplay();
        
        // 绘制初始游戏状态
        this.draw();
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // 按钮控制
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // 移动设备控制
        this.upBtn.addEventListener('click', () => {
            if (this.direction !== 'down') this.nextDirection = 'up';
        });
        
        this.downBtn.addEventListener('click', () => {
            if (this.direction !== 'up') this.nextDirection = 'down';
        });
        
        this.leftBtn.addEventListener('click', () => {
            if (this.direction !== 'right') this.nextDirection = 'left';
        });
        
        this.rightBtn.addEventListener('click', () => {
            if (this.direction !== 'left') this.nextDirection = 'right';
        });
        
        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }
    
    handleTouchStart(e) {
        if (this.gamePaused) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        const head = this.snake[0];
        const headX = head.x * this.gridSize;
        const headY = head.y * this.gridSize;
        
        const dx = touchX - headX;
        const dy = touchY - headY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平移动
            if (dx > 0 && this.direction !== 'left') {
                this.nextDirection = 'right';
            } else if (dx < 0 && this.direction !== 'right') {
                this.nextDirection = 'left';
            }
        } else {
            // 垂直移动
            if (dy > 0 && this.direction !== 'up') {
                this.nextDirection = 'down';
            } else if (dy < 0 && this.direction !== 'down') {
                this.nextDirection = 'up';
            }
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            clearInterval(this.gameLoop);
            this.pauseBtn.textContent = '继续';
            showGameMessage('游戏暂停');
        } else {
            this.gameLoop = setInterval(() => this.update(), this.speed);
            this.pauseBtn.textContent = '暂停';
            hideGameMessage();
        }
    }
    
    resetGame() {
        // 清除游戏循环
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        // 重置游戏状态
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        
        // 生成食物
        this.generateFood();
        
        // 更新按钮状态
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        
        // 更新显示
        this.updateDisplay();
        
        // 重绘游戏
        this.draw();
        
        // 隐藏任何游戏消息
        hideGameMessage();
    }
    
    update() {
        if (this.gamePaused) return;
        
        // 更新方向
        this.direction = this.nextDirection;
        
        // 移动蛇
        this.moveSnake();
        
        // 检查碰撞
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        // 检查是否吃到食物
        if (this.checkFood()) {
            this.handleFood();
        }
        
        // 重绘游戏
        this.draw();
    }
    
    moveSnake() {
        // 获取蛇头
        const head = {...this.snake[0]};
        
        // 根据方向移动蛇头
        switch(this.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 将新头部添加到蛇数组开头
        this.snake.unshift(head);
        
        // 如果没有吃到食物，移除尾部
        if (!this.checkFood()) {
            this.snake.pop();
        }
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }
        
        // 检查自身碰撞（从第二个身体部分开始检查）
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFood() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    handleFood() {
        // 增加分数
        this.score += this.scorePerFood;
        
        // 检查是否升级
        if (this.score >= this.level * 50) {
            this.level++;
            // 每升一级速度加快
            this.speed = Math.max(50, this.speed - 10);
            
            // 重新设置游戏循环
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.speed);
            
            // 播放升级音效
            playSound('levelUp');
        }
        
        // 生成新食物
        this.generateFood();
        
        // 更新显示
        this.updateDisplay();
        
        // 播放吃食物音效
        playSound('eat');
    }
    
    generateFood() {
        const maxX = Math.floor(this.canvas.width / this.gridSize);
        const maxY = Math.floor(this.canvas.height / this.gridSize);
        
        let food;
        let foodOnSnake;
        
        do {
            food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
            
            // 检查食物是否在蛇身上
            foodOnSnake = this.snake.some(segment => 
                segment.x === food.x && segment.y === food.y
            );
        } while (foodOnSnake);
        
        this.food = food;
    }
    
    gameOver() {
        // 停止游戏循环
        clearInterval(this.gameLoop);
        this.gameRunning = false;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // 更新显示
        this.updateDisplay();
        
        // 播放游戏结束音效
        playSound('gameOver');
        
        // 显示游戏结束消息
        showGameMessage(`游戏结束！得分: ${this.score}`, '再玩一次', () => {
            this.resetGame();
        });
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景（可选）
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;
        
        // 绘制水平线
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // 绘制垂直线
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 添加光泽效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 3,
            this.food.y * this.gridSize + this.gridSize / 3,
            this.gridSize / 6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawSnake() {
        // 绘制蛇身
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // 蛇头使用不同颜色
            if (i === 0) {
                this.ctx.fillStyle = '#2d3748';
            } else {
                // 身体部分使用渐变颜色
                const intensity = 1 - (i / this.snake.length) * 0.5;
                this.ctx.fillStyle = `rgb(45, 55, 72, ${intensity})`;
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // 添加圆角效果
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.highScoreElement.textContent = this.highScore;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});