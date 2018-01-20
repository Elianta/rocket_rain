(function () {
  let game;
  let gameWidth = 1000;
  let gameHeight = 650;
  let player;
  let aliens;
  let bullets;
  let bulletTime = 0;
  let cursors;
  let fireButton;
  let explosions;
  let explosionsMini;
  let starfield;
  let score = 0;
  let bestScore = 0;
  let scoreString = '';
  let scoreText;
  let lives = 4;
  let livesText;
  let enemyBullet;
  let firingTimer = 0;
  let firingDelay = 2000;
  let livingEnemies = [];
  let overlapX;
  let finalScreen;
  let finalScreenScore;

  function startGame() {
    game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'gameContainer', {
      preload: preload,
      create: create,
      update: update
    });
    this.classList.add('visually-hidden');
  }

  function preload() {
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('enemyBullet', 'assets/bulletEnemy.png');
    game.load.image('invader', 'assets/invader.png');
    game.load.image('ship', 'assets/playerShip.png');
    game.load.spritesheet('kaboom', 'assets/explode/4.png', 256, 256);
    game.load.image('life', 'assets/playerLife.png');
    game.load.image('starfield', 'assets/backgrounds/purple.png');
    game.load.image('cross', 'assets/cross.png');
    game.load.spritesheet('explodeMini', 'assets/explode/3.png', 256, 256);
    game.load.spritesheet('engine', 'assets/engine.png', 14, 31);
    game.load.spritesheet('engineEnemy', 'assets/engineEnemy2.png', 14, 31);
    game.load.image('playerShipDamage1', 'assets/damage/playerShipDamage1.png');
    game.load.image('playerShipDamage2', 'assets/damage/playerShipDamage2.png');
    game.load.image('playerShipDamage3', 'assets/damage/playerShipDamage3.png');
    game.load.audio('playerFire', 'assets/sound/playerFire2.wav');
    game.load.audio('explosion', 'assets/sound/explosion.wav');
    game.load.audio('lifeLost', 'assets/sound/lifeLost.wav');
    game.load.audio('enemyFire', 'assets/sound/enemyFire.wav');
    game.load.audio('gameMusic', 'assets/music/music1.mp3');
  }

  function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 0;

    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, gameWidth, gameHeight, 'starfield');

    //  Our bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('scale.x', 0.9);
    bullets.setAll('scale.y', 0.9);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // The enemy's bullets
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('scale.x', 0.7);
    enemyBullets.setAll('scale.y', 0.7);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    //  The hero!
    player = game.add.sprite(game.world.centerX, game.world.height - 60, 'ship');
    player.scale.setTo(0.6);
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.animations.add('explodeMini');
    player.addChild(createEngine(-32, 25, 'engine'));
    player.addChild(createEngine(19, 25, 'engine'));

    //  The baddies!
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;
    createAliens();

    //  The score
    scoreString = 'Score : ';
    scoreText = game.add.text(15, 12, scoreString + score, {font: '25px Kenvector Future', fill: '#fff'});

    //  Lives
    game.add.text(game.world.width - 215, 12, 'Lives : ', {font: '25px Kenvector Future', fill: '#fff'});
    // Life image
    let life = game.add.sprite(game.world.width - 90, 28, 'life');
    // Cross image
    game.add.sprite(game.world.width - 71, 20, 'cross');
    // Number of lives
    livesText = game.add.text(game.world.width - 45, 13, lives, {font: '25px Kenvector Future', fill: '#fff'});
    life.anchor.setTo(0.5, 0.5);
    life.angle = 90;
    life.scale.setTo(0.9);

    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    // Mini explosions on player
    explosionsMini = game.add.group();
    let explosionMiniItem = explosionsMini.create(0, 0, 'explodeMini', [0], false);
    explosionMiniItem.anchor.setTo(0.5, 0.5);
    explosionMiniItem.scale.setTo(0.4);
    explosionMiniItem.animations.add('explodeMini');

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // Audio
    playerFireSound = game.add.audio('playerFire');
    playerFireSound.volume = 1;
    explosionSound = game.add.audio('explosion');
    lifeLostSound = game.add.audio('lifeLost');
    lifeLostSound.volume = 0.4;
    enemyFireSound = game.add.audio('enemyFire');
    gameMusic = game.add.audio('gameMusic', 1, true);
    gameMusic.play();

    // Screen when game ends
    createFinalScreen();
    finalScreen.visible = false;
  }

  function createEngine(x, y, spriteKey) {
    let engine = game.make.sprite(x, y, spriteKey);
    engine.animations.add('blink');
    engine.play('blink', 10, true);
    return engine;
  }

  function createAliens() {
    aliens.visible = false;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 10; x++) {
        let alien = aliens.create(x * 85, y * 60, 'invader');
        alien.scale.setTo(0.5);
        alien.anchor.setTo(0.5, 0.5);
        alien.animations.add('fly', [0, 1, 2], 20, true);
        alien.play('fly');
        alien.body.moves = false;
        alien.addChild(createEngine(-26, -67, 'engineEnemy'));
        alien.addChild(createEngine(14, -67, 'engineEnemy'));
      }
    }
    aliens.x = 60;
    aliens.y = -300;
    aliens.visible = true;
    game.add.tween(aliens).to({y: 100}, 1500, Phaser.Easing.Linear.None, true, 0, 0, false);
    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    let tween = game.add.tween(aliens).to({x: 190}, 1500, Phaser.Easing.Linear.None, true, 0, 1, true);
    tween.loop(true);
    //  When the tween loops it calls descend
    tween.onLoop.add(descend, this);
  }

  function setupInvader(invader) {
    invader.anchor.x = 0.35;
    invader.anchor.y = 0.45;
    invader.animations.add('kaboom');
  }

  function createFinalScreen() {
    finalScreen = game.add.group();
    // Create background
    let finalScreenBG = finalScreen.add(game.make.graphics());
    finalScreenBG.beginFill(0x291b2e, 0.8);
    finalScreenBG.drawRect(0, 100, game.world.width, 450);
    // Create heading
    let finalScreenHeadingStyle = {
      font: "bold 52px Arial",
      fill: "#fff",
      boundsAlignH: "center",
      boundsAlignV: "middle"
    };
    let finalScreenHeading = finalScreen.add(game.make.text(0, 0, "GAME OVER!", finalScreenHeadingStyle));
    // Create gradient on heading
    let grd = finalScreenHeading.context.createLinearGradient(0, 0, 0, finalScreenHeading.height);
    grd.addColorStop(0, '#8ED6FF');
    grd.addColorStop(0.5, '#666ccf');
    grd.addColorStop(1, '#6d4ba9');
    finalScreenHeading.fill = grd;
    // Create shadow on heading
    finalScreenHeading.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    finalScreenHeading.setTextBounds(0, 150, game.world.width, 100);
    // Score texts
    let finalScreenScoreStyle = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"};
    finalScreenScore = finalScreen.add(game.make.text(0, 0, "Your Score: " + score + "\nBest Score: " + bestScore, finalScreenScoreStyle));
    finalScreenScore.setTextBounds(0, 100, game.world.width, 450);
    finalScreenScore.lineSpacing = 15;
    finalScreenRestart = finalScreen.add(game.make.text(0, 0, "click to restart...", finalScreenHeadingStyle));
    finalScreenRestart.fill = grd;
    finalScreenRestart.setTextBounds(0, 450, game.world.width, 100);
  }

  function descend() {
    let positionY = aliens.y;
    if (positionY >= 100 && aliens.length && player.alive) {
        game.add.tween(aliens).to({y: positionY + 10}, 1500, Phaser.Easing.Linear.None, true, 0, 0, false);
        checkWorldEnd();
    }
  }

  function checkWorldEnd() {
    let correction = 12;
    if (aliens.bottom + correction >= game.world.bottom) {
      endTheGame();
    }
  }

  function updateFinalScreenScore() {
    finalScreenScore.text = "Your Score: " + score + "\nBest Score: " + bestScore;
  }

  function update() {
    //  Scroll the background
    starfield.tilePosition.y += 2;
    if (player.alive) {
      //  Reset the player, then check for movement keys
      player.body.velocity.setTo(0, 0);
      // Move left or right
      if (cursors.left.isDown) {
        player.body.velocity.x = -200;
      } else if (cursors.right.isDown) {
        player.body.velocity.x = 200;
      }
      //  Firing
      if (fireButton.isDown) {
        fireBullet();
      }
      if (game.time.now > firingTimer) {
        enemyFires();
      }
      //  Run collision
      game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
      game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);
      game.physics.arcade.overlap(bullets, enemyBullets, bulletHitsEnemyBullet, null, this);
      game.physics.arcade.overlap(aliens, player, alienBumpIntoPlayer, null, this);
    }
  }

  function collisionHandler(bullet, alien) {
    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();
    //  Increase the score
    score += 20;
    scoreText.text = scoreString + score;
    //  And create an explosion :)
    let explosion = explosions.getFirstExists(false);
    explosionSound.play();
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 90, false, true);
    // If all aliens dead
    if (aliens.countLiving() === 0) {
      score += 1000;
      scoreText.text = scoreString + score;
      aliens.removeAll();
      setTimeout(createAliens, 2000);
      // make enemies fire more often
      firingDelay > 500 ? firingDelay -= 300 : firingDelay = 500;
    }
  }

  function bulletHitsEnemyBullet(bullet, enemyBullet) {
    let explosionAnimation = explosionsMini.getFirstExists(false);
    explosionSound.play();
    explosionAnimation.reset(bullet.x, bullet.y - 10);
    explosionAnimation.play('explodeMini', 150, false, true);
    bullet.kill();
    enemyBullet.kill();
    score += 30;
    scoreText.text = scoreString + score;
  }
  
  function alienBumpIntoPlayer(player, alien) {
    alien.kill();
    reduceLives();
  }

  function enemyHitsPlayer(player, bullet) {
    overlapX = bullet.body.x + 5;
    bullet.kill();
    reduceLives();
  }
  
  function reduceLives() {
    if (lives) {
      lives--;
      livesText.text = lives;
    }
    renderExplosion();
    // When the player dies
    if (lives < 1) {
      endTheGame();
    }
  }

  function renderExplosion() {
    if (lives >= 1) {
      let explosionAnimation = explosionsMini.getFirstExists(false);
      lifeLostSound.play();
      explosionAnimation.reset(overlapX, player.body.y + 10);
      explosionAnimation.worldAlpha = 1;
      explosionAnimation.play('explodeMini', 150, false, true);
      renderDamage();
    } else {
      let explosion = explosions.getFirstExists(false);
      explosionSound.play();
      explosion.reset(player.body.x, player.body.y);
      explosion.play('kaboom', 90, false, true);
    }
  }

  function endTheGame() {
    player.kill();
    enemyBullets.callAll('kill');
    aliens.removeAll();
    // check if score is the best
    checkBestScore();
    //update score
    updateFinalScreenScore();
    // display final screen
    finalScreen.visible = true;
    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
  }

  function checkBestScore() {
    if (score > bestScore) {
      bestScore = score;
    }
  }

  function renderDamage() {
    let damage;
    switch (lives) {
      case 1:
        player.removeChildAt(2);
        damage = game.make.sprite(-59, -40, 'playerShipDamage3');
        damage.scale.x = 1.05;
        damage.scale.y = 1.05;
        damage.alpha = 0.9;
        player.addChild(damage);
        break;
      case 2:
        player.removeChildAt(2);
        damage = game.make.sprite(-59, -40, 'playerShipDamage2');
        damage.scale.x = 1.05;
        damage.scale.y = 1.05;
        damage.alpha = 0.9;
        player.addChild(damage);
        break;
      case 3:
        damage = game.make.sprite(-60, -39, 'playerShipDamage1');
        damage.scale.x = 1.05;
        damage.scale.y = 1.05;
        damage.alpha = 0.9;
        player.addChild(damage);
        break;
    }
  }

  function enemyFires() {
    //  Grab the first bullet we can from the pool
    enemyBullet = enemyBullets.getFirstExists(false);
    livingEnemies.length = 0;

    aliens.forEachAlive(function (alien) {
      // put every living enemy in an array
      livingEnemies.push(alien);
    });

    if (enemyBullet && livingEnemies.length > 0) {
      let random = game.rnd.integerInRange(0, livingEnemies.length - 1);
      // randomly select one of them
      let shooter = livingEnemies[random];
      enemyFireSound.play();
      // enemy bullet appears near enemy
      enemyBullet.reset(shooter.body.x, shooter.body.y + 60);
      // and moves to player with specified speed
      let angle = game.physics.arcade.angleBetween(enemyBullet, player) * 180 / Math.PI;
      enemyBullet.angle = angle - 85;
      game.physics.arcade.accelerateToObject(enemyBullet, player, 260);
      firingTimer = game.time.now + firingDelay;
    }
  }

  function fireBullet() {
    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTime) {
      //  Grab the first bullet we can from the pool
      bullet = bullets.getFirstExists(false);
      if (bullet) {
        //  And fire it
        playerFireSound.play();
        bullet.reset(player.x, player.y + 8);
        bullet.body.velocity.y = -400;
        bulletTime = game.time.now + 500;
      }
    }

  }

  function restart() {
    //  A new level starts
    finalScreen.visible = false;
    // Remove damage
    player.removeChildAt(2);
    // resets the life count
    lives = 4;
    livesText.text = lives;
    //  And brings the aliens back from the dead :)
    createAliens();
    score = 0;
    scoreText.text = scoreString + score;
    //revives the player
    player.revive();
  }

  window.preload = preload;
  window.create = create;
  window.update = update;
  window.startGame = startGame;

})();
