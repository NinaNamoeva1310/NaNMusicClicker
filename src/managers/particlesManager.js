import { Container, Assets } from 'pixi.js';
import * as particles from '@sosuisen/particle-emitter'

const colors = ["7DE881", "7DD8E8", "E87DD4", "887DE8", "E8DF7D"]

const particlesManager = {
    app: null,
    textures: [],
    emitter: null,
    particlesContainer: null,
    emitterTicker: null,
    elapsed: 0,
    emitter2: null,
    particlesContainer2: null,
    emitterTicker2: null,
    elapsed2: 0,
    errorTextures:[null],

    async initialize(app) {
        this.app = app;

        const texture = await Assets.load('./img/particles/1.png');
        this.textures.push(texture)
        const texture2 = await Assets.load('./img/particles/2.png');
        this.textures.push(texture2)
        const texture3 = await Assets.load('./img/particles/3.png');
        this.textures.push(texture3)
        const texture4 = await Assets.load('./img/particles/4.png');
        this.textures.push(texture4)

        const errorTexture = await Assets.load('./img/particles/error.png');
        this.errorTextures.push(errorTexture)
    },

    start(x = 100, y = 100, colorIndex) {

        console.log(colors[colorIndex])
        // Clean up any existing emitter
        this.stop();

        const particlesContainer = new Container();
        this.app.stage.addChild(particlesContainer);

        var emitter = new particles.Emitter(
            particlesContainer,
            {
                lifetime: {
                    min: 0.1,
                    max: 2
                },
                frequency: 0.08,
                spawnChance: 1,
                particlesPerWave: 4,
                emitterLifetime: 0.3,
                maxParticles: 1000,
                pos: {
                    x: x,
                    y: y
                },
                addAtBack: false,
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    {
                                        value: 0.4,
                                        time: 0
                                    },
                                    {
                                        value: 0,
                                        time: 1
                                    }
                                ],
                            },
                        }
                    },
                    {
                        type: 'scale',
                        config: {
                            scale: {
                                list: [
                                    {
                                        value: 0.15,
                                        time: 0
                                    },
                                    {
                                        value: 0,
                                        time: 1
                                    }
                                ],
                            },
                        }
                    },
                    {
                        type: 'moveSpeed',
                        config: {
                            speed: {
                                list: [
                                    {
                                        value: 400,
                                        time: 0
                                    },
                                    {
                                        value: 100,
                                        time: 1
                                    }
                                ],
                                isStepped: false
                            },
                        }
                    },
                    {
                        type: 'rotationStatic',
                        config: {
                            min: 0,
                            max: 360
                        }
                    },
                    {
                        "type": "color",
                        "config": {
                            "color": {
                                "list": [
                                    {
                                        "time": 0,
                                        "value": colors[colorIndex]
                                    },
                                    {
                                        "time": 1,
                                        "value": "ffffff"
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "type": "rotation",
                        "config": {
                            "accel": 0,
                            "minSpeed": 0,
                            "maxSpeed": 120,
                            "minStart": 0,
                            "maxStart": 360
                        }
                    },
                    {
                        type: 'spawnShape',
                        config: {
                            type: 'torus',
                            data: {
                                x: 0,
                                y: 0,
                                radius: 10
                            }
                        }
                    },
                    {
                        type: 'textureRandom',
                        config: {
                            textures: this.textures
                        }
                    }
                ],
            }
        )

        emitter.emit = true

        this.elapsed = Date.now();
        this.emitter = emitter;
        this.particlesContainer = particlesContainer;

        // Используем app.ticker для обновления эмиттера
        const tickerCallback = () => {
            if (this.emitter) {
                const now = Date.now();
                this.emitter.update((now - this.elapsed) * 0.001);
                this.elapsed = now;
            }
        };
        this.app.ticker.add(tickerCallback);
        this.emitterTicker = tickerCallback;
    },

    start2(x = 100, y = 100) {
        // Clean up any existing second emitter
        this.stop2();

        const particlesContainer2 = new Container();
        this.app.stage.addChild(particlesContainer2);

        var emitter2 = new particles.Emitter(
            particlesContainer2,
            {
                lifetime: {
                    min: 0.1,
                    max: 2
                },
                frequency: 0.08,
                spawnChance: 1,
                particlesPerWave: 4,
                emitterLifetime: 0.3,
                maxParticles: 1000,
                pos: {
                    x: x,
                    y: y
                },
                addAtBack: false,
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    {
                                        value: 0.4,
                                        time: 0
                                    },
                                    {
                                        value: 0,
                                        time: 1
                                    }
                                ],
                            },
                        }
                    },
                    {
                        type: 'scale',
                        config: {
                            scale: {
                                list: [
                                    {
                                        value: 0.15,
                                        time: 0
                                    },
                                    {
                                        value: 0,
                                        time: 1
                                    }
                                ],
                            },
                        }
                    },
                    {
                        type: 'moveSpeed',
                        config: {
                            speed: {
                                list: [
                                    {
                                        value: 400,
                                        time: 0
                                    },
                                    {
                                        value: 100,
                                        time: 1
                                    }
                                ],
                                isStepped: false
                            },
                        }
                    },
                    {
                        type: 'rotationStatic',
                        config: {
                            min: 0,
                            max: 360
                        }
                    },
                    {
                        "type": "rotation",
                        "config": {
                            "accel": 0,
                            "minSpeed": 0,
                            "maxSpeed": 120,
                            "minStart": 0,
                            "maxStart": 360
                        }
                    },
                    {
                        type: 'spawnShape',
                        config: {
                            type: 'torus',
                            data: {
                                x: 0,
                                y: 0,
                                radius: 10
                            }
                        }
                    },
                    {
                        type: 'textureRandom',
                        config: {
                            textures: this.errorTextures
                        }
                    }
                ],
            }
        )

        emitter2.emit = true

        this.elapsed2 = Date.now();
        this.emitter2 = emitter2;
        this.particlesContainer2 = particlesContainer2;

        // Используем app.ticker для обновления второго эмиттера
        const tickerCallback2 = () => {
            if (this.emitter2) {
                const now = Date.now();
                this.emitter2.update((now - this.elapsed2) * 0.001);
                this.elapsed2 = now;
            }
        };
        this.app.ticker.add(tickerCallback2);
        this.emitterTicker2 = tickerCallback2;
    },

    stop() {
        // Очистка первого эмиттера
        if (this.emitterTicker) {
            this.app.ticker.remove(this.emitterTicker);
            this.emitterTicker = null;
        }
        if (this.emitter) {
            this.emitter.emit = false;
            this.emitter.destroy();
            this.emitter = null;
        }
        if (this.particlesContainer) {
            this.app.stage.removeChild(this.particlesContainer);
            this.particlesContainer.destroy();
            this.particlesContainer = null;
        }
    },

    stop2() {
        // Очистка второго эмиттера
        if (this.emitterTicker2) {
            this.app.ticker.remove(this.emitterTicker2);
            this.emitterTicker2 = null;
        }
        if (this.emitter2) {
            this.emitter2.emit = false;
            this.emitter2.destroy();
            this.emitter2 = null;
        }
        if (this.particlesContainer2) {
            this.app.stage.removeChild(this.particlesContainer2);
            this.particlesContainer2.destroy();
            this.particlesContainer2 = null;
        }
    },

    stopAll() {
        // Очистка всех эмиттеров
        this.stop();
        this.stop2();
    },

    setPosition(x, y) {
        if (this.emitter) {
            this.emitter.pos.x = x;
            this.emitter.pos.y = y;
        }
    },

    setPosition2(x, y) {
        if (this.emitter2) {
            this.emitter2.pos.x = x;
            this.emitter2.pos.y = y;
        }
    }
}

export default particlesManager
