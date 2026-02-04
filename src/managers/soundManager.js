import {Howl, Howler} from 'howler';


const client = {
    kickSounds: [],
    sound:null,
    secondKickSound: null,
    secondKickSound: null,
    currentKickId: 0,
    final: null,
    loop:null,
    initialize() {
        this.kickSounds.push(new Howl({
            src: ['./sounds/1.mp3'],
            volume:1,
            html5: true
        }));
        this.kickSounds.push(new Howl({
            src: ['./sounds/2.mp3'],
                volume:1,
                html5: true
            }));
        this.kickSounds.push(new Howl({
            src: ['./sounds/3.mp3'],
            volume:1,
            html5: true
        }));
        this.final = new Howl({
            src: ['./sounds/final.mp3'],
            volume:1,
            html5: true
        });

        this.loop = new Howl({
            src: ['./sounds/loop.mp3'],
            volume:1,
            html5: true,
            loop:true
        });
    },
    playLoop() {
        this.loop.play()
    },
    stopLoop() {
        this.loop.pause()
    },
    playSound(path, finishCb) {
        this.stopLoop()
        this.currentKickId = 0

        this.sound.play();
        this.sound.once('end', () => {
            finishCb()
            this.playLoop()
            this.final.play()
        })
    },
    loadSound(path, cb) {
        this.sound = new Howl({
            src: [path],
            volume:1,
            html5: true
        });
        
        this.sound.once('load', () => {
            cb()
        });
    },
    playKickSound() {
        return
        this.kickSounds[this.currentKickId % this.kickSounds.length].play()
        this.currentKickId++
    },
    mute() {
        Howler.volume(0)
    },
    unmute() {
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                Howler.volume(1)
            }, 300)
        }
        
    }
}

window.addEventListener('blur', () => {
    client.mute()
})
window.addEventListener('focus', () => {
    client.unmute()
  })

window.addEventListener('pointerdown', () => {
    client.unmute()
})

export default client