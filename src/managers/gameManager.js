import { Application, Assets, Container, Sprite, ParticleContainer, Particle, loadTextures } from 'pixi.js';
import { Tween, Easing } from '@tweenjs/tween.js'
import soundManager from './soundManager'
import particlesManager from './particlesManager'

const client = {
    app: null,
    finishCb: null,
    errorCb: null,
    loadCb:null,
    gameCanvas: null,
    textures: [],
    outlineTextures:[],
    bits: [],
    levelPoints: 0,
    levelScore: 0,
    removeTwins: [],
    async initialize(finishCb, errorCb, loadCb) {
        this.finishCb = finishCb
        this.errorCb = errorCb
        this.loadCb = loadCb

        soundManager.initialize()
        
        this.app = new Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window, devicePixelRatio: 3 });

        await this.loadTextures()

        // Initialize particles manager
        particlesManager.initialize(this.app, this.textures);

        document.body.appendChild(this.app.canvas);
        
        this.gameCanvas = document.getElementsByTagName('canvas')[0]
    },
    startLoop() {
        soundManager.playLoop()
    },
    async loadTextures() {
        const texture = await Assets.load('./img/bits/1.png');
        this.textures.push(texture)
        const texture2 = await Assets.load('./img/bits/2.png');
        this.textures.push(texture2)
        const texture3 = await Assets.load('./img/bits/3.png');
        this.textures.push(texture3)
        const texture4 = await Assets.load('./img/bits/4.png');
        this.textures.push(texture4)
        const texture5 = await Assets.load('./img/bits/5.png');
        this.textures.push(texture5)

        const outlineTexture = await Assets.load('./img/bits/o1.png');
        this.outlineTextures.push(outlineTexture)
        const outlineTexture2 = await Assets.load('./img/bits/o2.png');
        this.outlineTextures.push(outlineTexture2)
        const outlineTexture3 = await Assets.load('./img/bits/o3.png');
        this.outlineTextures.push(outlineTexture3)
        const outlineTexture4 = await Assets.load('./img/bits/o4.png');
        this.outlineTextures.push(outlineTexture4)
        const outlineTexture5 = await Assets.load('./img/bits/o5.png');
        this.outlineTextures.push(outlineTexture5)
    },
    showCanvas() {
        this.gameCanvas.classList.add('visible')
    },
    hideCanvas() {
        this.gameCanvas.classList.remove('visible')
    },
    async startLevel(levelData, levelConfig) {
        this.showCanvas()
        soundManager.playSound(`./songs/${levelConfig.id}/sound.mp3`, () => { this.finishLevel() })
        this.createBits(levelData, levelConfig)
    },
    prepareSong(levelData, levelConfig, cb) {
        soundManager.loadSound(`./songs/${levelConfig.id}/sound.mp3`, cb)
    },
    
    createBits(levelData, levelConfig) {
        for (let i = 0; i < levelData.length; i++){
            const bitColorIndex = Math.floor(Math.random() * this.textures.length)
            const bit = new Sprite(this.textures[bitColorIndex]);
            bit.bitColorIndex = bitColorIndex

            const outline = new Sprite(this.outlineTextures[bitColorIndex]);
            outline.anchor.set(0.5);
            outline.scale.set(0.5);
            outline.alpha = 0
            outline.x = this.app.screen.width * levelData[i].position.x;
            outline.y = this.app.screen.height * levelData[i].position.y;

            bit.outline = outline

            bit.anchor.set(0.5);
            bit.scale.set(0);
            
            bit.x = this.app.screen.width * levelData[i].position.x;
            bit.y = this.app.screen.height * levelData[i].position.y;
            bit.alpha = 0
            bit.points = 0
            
            this.app.stage.addChildAt(bit, 0);
            this.app.stage.addChildAt(outline, 0);

                let bitData = {
                    scale: 0,
                    opacity: 0,
                    outlineScale: 0.5,
                    points:0
                }

                const tween = new Tween(bitData)
                .to({scale: 0.33, opacity:1, outlineScale:0.33, points:100}, 3000) 
                    .easing(Easing.Quartic.In)
                    .delay(levelData[i].delay - 3000)
                    .onUpdate(() => {
                        bit.scale.set(bitData.scale);
                        bit.alpha = bitData.opacity
                        bit.points = bitData.points
                        bit.outline.scale.set(bitData.outlineScale)
                        bit.outline.alpha = bitData.opacity
                    }).onComplete(() => {
                        this.app.stage.removeChild(bit.outline)
                        let bitFinishData = {
                            scale: 0.33,
                            opacity: 1,
                            points:100
                        }
                    let removeTween = new Tween(bitFinishData).to({scale: 0, opacity:0, points:0}, 300).onUpdate(() => {
                        bit.scale.set(bitFinishData.scale);
                        bit.points = bitFinishData.points
                    }).onComplete(() => {
                        this.app.stage.removeChild(bit)
                        this.errorCb()
                        particlesManager.start2(bit.position.x, bit.position.y, bit.bitColorIndex);
                    }).start()

                    bit.tween = removeTween
                })
                .start() // Start the tween immediately.
                
                bit.tween = tween

                bit.eventMode = 'static';
                bit.cursor = 'pointer';
            
                bit.on('pointerdown', () => { onBitClick(bit) })

                this.bits.push(bit)
        }
    },
    finishLevel() {
        this.hideCanvas()
        this.levelScore = this.levelPoints / this.bits.length
        
        // Stop particles
        particlesManager.stop();
        
        this.finishCb(this.levelScore.toFixed(2))
    }
}

function onBitClick(bit) {
    if (window.navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    particlesManager.start(bit.position.x, bit.position.y, bit.bitColorIndex);
  
    soundManager.playKickSound()

    const outline = new Sprite(client.outlineTextures[bit.bitColorIndex]);
                
    outline.anchor.set(0.5);
    outline.scale.set(0);
    outline.alpha = 0.5
    outline.x = bit.position.x;
    outline.y = bit.position.y;

    client.app.stage.addChild(outline);

    let bitData = {
        scale: 0,
        opacity: 0.5
    }

    const tween = new Tween(bitData) // Create a new tween that modifies 'coords'.
    .to({scale: 1, opacity:0}, 300) // Move to (300, 200) in 1 second.
        .easing(Easing.In) // Use an easing function to make the animation smooth.
        .onUpdate(() => {
            outline.scale.set(bitData.scale);
            outline.alpha = bitData.opacity
        }).onComplete(() => {
            client.app.stage.removeChild(outline)
    }).start()
    
    client.removeTwins.push(tween)

    bit.tween.stop();
    
    client.levelPoints += bit.points
    client.app.stage.removeChild(bit.outline)
    client.app.stage.removeChild(bit)
}

function animate(time) {
    if (document.hidden) {
        requestAnimationFrame(animate)
        return
    }
    for (let i = 0; i < client.bits.length; i++) {
        client.bits[i].tween.update(time)
    }

    for (let i = 0; i < client.removeTwins.length; i++) {
        client.removeTwins[i].update(time)
    }

    // Эмиттер теперь обновляется через app.ticker



    requestAnimationFrame(animate)
}
requestAnimationFrame(animate)

export default client