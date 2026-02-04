<template>
  <div class="home">

    <div v-if="!isLoopStarted" class="start-scene" @click="startLoop">
      <div class="preload-logo">
        <span class="loading-span loading-span-1">N</span>
        <span class="loading-span loading-span-2">a</span>
        <span class="loading-span loading-span-3">N</span>
        <span class="loading-span loading-span-4">·</span>
        <span class="loading-span loading-span-5">d</span>
        <span class="loading-span loading-span-6">e</span>
        <span class="loading-span loading-span-7">v</span>
      </div>
      <span class="loading-span loading-span-8">Touch to continue...</span>
    </div>

    <transition name="lb-transition">
      <div v-if="isLeaderboardVisible" class="scene leaderboard-scene">
        <div class="close-lb-wrapper" @click="toggleLeaderboardView">
          <img src="@/assets/icons/close.svg" alt="">
        </div>
        <span class="heading">Leaderboard</span>
        <div class="leaderboard-users-wrapper">
          <div class="actual-profile" v-for="(user, index) in preparedLeaderboardData">
            <span>#{{ index + 1 }}</span>
            <img :src="user.image" alt="">
            <span>{{ user.name }}</span>
            <span>{{ user.totalProgress }}%</span>
          </div>
        </div>
      </div>
    </transition>

    <transition name="menu-transition">
      <div v-if="gameState == 'selectUser'" class="scene registration-scene">
        <span>Select profile:</span>
        <div class="profile-list">
          <div class="single-profile" v-for="profile in gameData.users" @click="loadProfile(profile.id)">
            <img :src="profile.image" alt="">
            <div class="name-wrapper">
              <span>{{ profile.name }}</span>
            </div>
          </div>
          <div class="new-profile" @click="switchScene('registration')">
            <img src="@/assets/icons/add.svg" alt="">
          </div>
        </div>
      </div>
    </transition>

    <transition name="menu-transition">
      <div v-if="gameState == 'registration'" class="scene registration-scene">
        <div class="input-wrapper">
          <div class="user-picture-wrapper" :style="{ backgroundImage: `url(${userData.image})` }"
            @click="triggerUserPicInput"></div>

          <input type="file" ref="userPicInput" class="hidden-input" accept="image/png, image/gif, image/jpeg"
            @change="handleImageSelection" />
        </div>
        <div class="input-wrapper">
          <input type="text" v-model="userData.name" placeholder="Please, enter your name">
        </div>
        <div class="button registration-button" :class="{ 'active': userData.image && userData.name.length > 2 }"
          @click="saveUserData">
          <span>Continue</span>
        </div>
      </div>
    </transition>

    <transition name="menu-transition">
      <div v-if="gameState == 'menu'" class="scene menu-scene">
        <div class="menu-profile-wrapper">
          <div class="actual-profile">
            <img :src="userData.image" alt="">
            <span>{{ userData.name }}</span>
            <span>{{ calculatedTotalProgress }}%</span>
          </div>
          <div class="lb-button-wrapper" @click="toggleLeaderboardView">
            <img src="@/assets/icons/leaderboard.svg" alt="">
          </div>
        </div>
        <div class="songs-list">
          <div v-for="(song, index) in songsData" :key="song.id" class="single-song"
            :style="{ animationDelay: 0.15 * (index + 1) + 's' }" @click="toGame(song.id)">
            <div class="song-info">
              <span class="song-name" v-html="song.name"></span>
              <span class="song-author">by {{ song.author }}</span>
              <span class="song-result" v-if="userData.progress[song.id]">Best score: {{ userData.progress[song.id]
                }}%</span>
            </div>
            <div class="song-action">
              <div class="play-button"><img src="@/assets/icons/play.svg" alt=""></div>
            </div>
            <div class="song-preview">
              <img :src="`./songs/${song.id}/preview.jpg`" alt="">
            </div>
            <div class="song-preview-overlay"></div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="game-transition">
      <div v-if="gameState == 'game'" class="scene game-scene">
        <video autoplay loop muted playsinline class="video-background" :class="{ 'active': errorHappened }"
          @loadeddata="handleVideoLoad">
          <source :src="`./songs/${currentSong.id}/video.mp4`" type="video/mp4">
        </video>
        <div class="song-duration">
          <div class="song-duration-bar" :class="{ 'active': isLevelReady }"
            :style="{ transitionDuration: `${currentSong.duration / 1000}s` }"></div>
        </div>
        <div class="gameplay-overlay"></div>
        <div class="error-overlay" :class="{ 'active': errorHappened }"></div>
      </div>
    </transition>

    <transition name="menu-transition">
      <div v-if="gameState == 'finish'" class="scene finish-scene">
        <div class="finish-wrapper" :style="{ backgroundImage: `url(./songs/${currentSong.id}/preview.jpg)` }">
          <div class="overlay"></div>
          <div class="finish-inner">
            <div class="finish-song-info">
              <span class="song-name" v-html="currentSong.name"></span>
              <span class="song-author">by {{ currentSong.author }}</span>
            </div>

            <div class="result-info">
              <span class="result">{{ levelResult }}%</span>
            </div>
            <div class="finish-button-wrapper">
              <div class="button" @click="openMenu">Continue</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import gameManager from './managers/gameManager'
import { saveData, getData } from './utils/indexedDB.js';

let imageSelectionProcess = true

export default {
  name: 'HomeView',
  data() {
    return {
      gameState: "idle",
      currentSong: {},
      songsData: [],
      currentSongData: {},
      levelResult: 0,
      errorHappened: false,
      isVideoReady: false,
      isGameReady: false,
      isLoopStarted: false,
      gameData: {},
      userData: {
        id: '',
        name: '',
        image: '',
        progress: {}
      },
      isLeaderboardVisible: false
    }
  },
  computed: {
    preparedLeaderboardData() {
      let buffer = Object.values(structuredClone(this.gameData.users))

      for (let i = 0; i < buffer.length; i++) {
        buffer[i].totalProgress = this.calculatedTotalUserProgress(buffer[i])
      }

      return buffer.sort((a, b) => b.totalProgress - a.totalProgress)
    },
    isLevelReady() {
      return this.isGameReady && this.isVideoReady
    },
    calculatedTotalProgress() {
      let buffer = 0

      for (const key in this.userData.progress) {
        buffer = parseFloat(this.userData.progress[key]) + parseFloat(buffer)
      }

      return (buffer / this.songsData.length).toFixed(2)
    },
  },
  methods: {
    startLoop() {
      this.isLoopStarted = true
      gameManager.startLoop()
    },
    toggleLeaderboardView() {
      this.isLeaderboardVisible = !this.isLeaderboardVisible
    },
    calculatedTotalUserProgress(user) {
      let buffer = 0

      for (const key in user.progress) {
        buffer = parseFloat(buffer) + parseFloat(user.progress[key])
      }

      return (buffer / this.songsData.length).toFixed(2)
    },
    triggerUserPicInput() {
      imageSelectionProcess = true
      this.$refs.userPicInput.click()

    },
    switchScene(scene) {
      return new Promise((resolve, reject) => {
        this.gameState = 'idle'
        setTimeout(() => {
          this.gameState = scene
          resolve()
        }, 400)
      })
    },
    loadProfile(id) {
      this.userData = this.gameData.users[id]
      this.switchScene('menu')
    },
    async toGame(id) {
      this.videoReady = false
      this.currentSong = this.songsData.filter(el => el.id == id)[0]

      let currentSong = await fetch(`./songs/${this.currentSong.id}/config.json`);
      let currentSongData = await currentSong.json();
      this.currentSongData = currentSongData.bits

      gameManager.prepareSong(this.currentSongData, this.currentSong, this.loadVideo)
    },
    async loadVideo() {
      await this.switchScene('game')
    },
    handleVideoLoad() {
      this.isVideoReady = true

      this.startLevel()
    },
    async startLevel() {
      this.songDuration = this.currentSong.duration
      this.isGameReady = true
      await gameManager.startLevel(this.currentSongData, this.currentSong);
    },

    async finishLevel(result) {
      this.levelResult = result
      this.isGameReady = false
      this.isVideoReady = false

      let buffer = structuredClone(this.userData)

      if (buffer.progress[this.currentSong.id]) {
        buffer.progress[this.currentSong.id] = buffer.progress[this.currentSong.id] < result ? result : buffer.progress[this.currentSong.id]
      } else {
        buffer.progress[this.currentSong.id] = result
      }

      this.userData = buffer

      let bufferGameData = structuredClone(this.gameData)
      bufferGameData.users[this.userData.id] = this.userData
      this.gameData = bufferGameData

      saveData(this.gameData)

      await this.switchScene('finish')
    },
    triggerError() {
      if (this.errorTimeout != null) {
        return
      }

      this.errorHappened = true
      this.errorTimeout = setTimeout(() => {
        this.errorHappened = false
        this.errorTimeout = null
      }, 300)
    },
    openMenu() {
      this.switchScene('menu')
    },
    handleImageSelection(event) {
      console.log(event)

      const reader = new FileReader();
      reader.onload = () => {
        this.userData.image = reader.result // Store Base64 string
      };
      reader.readAsDataURL(event.target.files[0]);
      imageSelectionProcess = false

    },
    async saveUserData() {
      this.userData.id = Date.now()


      if (!this.gameData.users) {
        this.gameData.users = {}
      }

      this.gameData.users[this.userData.id] = this.userData

      await saveData(this.gameData)

      this.switchScene('menu')
    }
  },
  async mounted() {

  },
  async created() {
    let gameData = await getData()
    if (gameData && gameData.users) {
      this.gameState = 'selectUser'
    } else {
      this.gameState = 'registration'
    }

    this.gameData = gameData || {}

    let songs = await fetch(`./songs/config.json`);
    let songsData = await songs.json();


    this.songsData = songsData.songs
    this.currentSong = this.songsData[0]

    gameManager.initialize((result) => { this.finishLevel(result) }, this.triggerError, this.loadVideo)
  }
}

window.addEventListener('focus', () => {
  if (!imageSelectionProcess) {
    window.location.reload();
  }
})

</script>


<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

* {
  box-sizing: border-box;
}

*::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

html {
  overflow: hidden;
  background: #14141e;
}

body {
  background: #14141e;
  position: fixed;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
  -webkit-focus-ring-color: rgba(255, 255, 255, 0);
  outline: none;

  -moz-user-select: none;
  -o-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  resize: none;

  -webkit-text-size-adjust: none;
  height: 100vh;

  font-family: 'Inter', sans-serif;
}

.registration-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 40px;
  padding: 40px;
}

.registration-scene>span {
  font-size: 24px;
  color: white;
}

.input-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.input-wrapper span {
  color: white;
  font-size: 12px;
}

input[type="text"] {
  background: none;
  border-radius: 0px;
  border: none;
  box-shadow: none;
  outline: none;
  border-bottom: 1px solid rgba(255, 255, 255, .3);
  padding: 8px;
  width: 100%;
  color: white;
  font-size: 16px;
  text-align: center;
}

input[type="text"]:focus {
  border-bottom: 1px solid rgba(255, 255, 255, 1);
}

.home {
  background: #14141e;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.scene {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;

  position: fixed;
  top: 0;
  left: 0;
}

.scene.menu-scene {
  align-items: flex-start;
  flex-direction: column;
}

.songs-list {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  padding: 20px;
  max-width: 440px;
}

.single-song {
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background: #1b1b29;
  border-radius: 4px;
  cursor: pointer;
  padding: 16px 32px;
  position: relative;
  height: 200px;

  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  opacity: 0;
  transform: translateX(-100px);

  animation: moveIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.song-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  position: relative;
  z-index: 3;
}

.finish-wrapper {
  height: 100%;
  padding: 40px 40px 80px 40px;
  width: 100%;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  position: relative;
}

.finish-wrapper .overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #14141E;
  opacity: 0.8;
  z-index: 0;
}

.finish-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
  z-index: 3;
}

.finish-song-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.finish-song-info span.song-name {
  font-size: 32px;
  font-weight: 600;
  color: white;
  text-align: center;
  opacity: 0;
  transform: scale(0);
  animation: fadeIn .6s cubic-bezier(0.68, -0.55, 0.265, 1.55) .6s forwards;
}

.finish-song-info span.song-author {
  font-size: 16px;
  text-align: center;
  color: white;
  opacity: .5;
  opacity: 0;
  transform: scale(0);
  animation: fadeIn .6s cubic-bezier(0.68, -0.55, 0.265, 1.55) .9s forwards;
}


.song-action {
  position: relative;
  z-index: 3;
}

.song-info span {
  color: white;
}

.song-info span.song-author {
  font-size: 12px;
  opacity: .3;
}

.song-info span.song-name {
  font-size: 20px;
  font-weight: 600;
}


.result-info {
  opacity: 0;
  transform: scale(0);
  animation: fadeIn .6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1.2s forwards;
}

span.result {
  color: white;
  font-size: 72px;
  font-weight: 800;

}

.play-button img {
  width: 16px;
  filter: brightness(0) invert(1);
}

.song-preview {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 1;
}

.song-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.song-preview-overlay {
  position: absolute;
  right: 0;
  top: 0;
  height: 200px;
  width: 100%;

  background: #1B1B29;
  background: linear-gradient(90deg, rgba(27, 27, 41, 1) 0%, rgba(27, 27, 41, 0) 100%);

  z-index: 2;
}

.menu-transition-enter {
  transform: scale(0);
  opacity: 0;
}

.menu-transition-enter-to {
  transform: scale(1);
  opacity: 1;
}

.menu-transition-enter-active {
  transition: all .3s ease-out;
}

.menu-transition-leave {
  transform: scale(1);
  opacity: 1;
}

.menu-transition-leave-to {
  transform: scale(5);
  opacity: 0;
}

.menu-transition-leave-active {
  transition: all .3s ease-in;
}


.game-transition-enter {
  opacity: 0;
}

.game-transition-enter-to {
  opacity: 1;
}

.game-transition-enter-active {
  transition: all .3s ease-out;
}

.game-transition-leave {
  opacity: 1;
}

.game-transition-leave-to {
  opacity: 0;
}

.game-transition-leave-active {
  transition: all .3s ease-in;
}

.game-scene {}

.level-bg {
  position: absolute;
  top: -25px;
  left: -25px;
  width: calc(100% + 50px);
  height: calc(100% + 50px);
  z-index: 1;
  background-position: center center !important;
  background-size: cover !important;
}

.level-bg.active {
  animation: shake .3s linear infinite;
}

@keyframes shake {
  0% {
    transform: scale(1) rotate(0deg);
  }

  25% {
    transform: scale(1.05);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: scale(1.05);
  }

  100% {
    transform: rotate(0deg);
  }
}


video {
  position: absolute;
  top: -20%;
  left: 0;
  width: 100%;
  height: 140%;
  z-index: 1;

  object-fit: cover;
  object-position: center center;
}

.song-duration {
  z-index: 4;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
}

.song-duration-bar {
  height: 100%;
  background: #7942f8;
  width: 0%;
  transition: all .3s linear;
}


.song-duration-bar.active {
  width: 100%;
}

@keyframes fill {
  from {
    width: 0%;
  }

  to {
    width: 100%;
  }
}

video.active {
  animation: shake .3s linear infinite;
}

video::-webkit-media-controls {
  display: none;
}

/* Could Use thise as well for Individual Controls */
video::-webkit-media-controls-play-button {}

video::-webkit-media-controls-volume-slider {}

video::-webkit-media-controls-mute-button {}

video::-webkit-media-controls-timeline {}

video::-webkit-media-controls-current-time-display {}

.gameplay-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  background: #14141ec9;
  z-index: 2;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  background: #a81f1fc9;
  z-index: 3;
  opacity: 0;
}

.error-overlay.active {
  animation: error .3s linear;
}

@keyframes error {
  0% {
    opacity: 0;
  }

  25% {
    opacity: 0.5;
  }

  50% {
    opacity: 0;
  }

  75% {
    opacity: 0.5;
  }

  100% {
    opacity: 0;
  }
}

.finish-button-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  opacity: 0;
  transform: translateY(200px);
  animation: moveUp 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1s forwards;
}

@keyframes moveUp {
  from {
    opacity: 0;
    transform: translateY(200px);
  }

  to {
    opacity: 1;
    transform: translateY(0px);
  }
}

@keyframes moveRight {
  from {
    opacity: 0;
    transform: translateX(-100px);
  }

  to {
    opacity: 1;
    transform: translateX(0px);
  }
}

@keyframes moveIn {
  from {
    opacity: 0;
    transform: scale(0);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.button {
  width: 100%;
  max-width: 320px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #673ab7;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.user-picture-wrapper {
  width: 128px;
  height: 128px;
  border-radius: 1000px;
  background-color: #673ab7;

  background-size: cover !important;
  background-position: center center !important;
}

.hidden-input {
  position: fixed;
  top: -999999px;
}

.profile-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  overflow: scroll;
  padding-bottom: 120px;
}

.single-profile {
  width: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 4px;
  padding: 0px;
  position: relative;
}

.single-profile img {
  width: 128px;
  height: 128px;
  border-radius: 4px;
  object-fit: cover;
  object-position: center center;
}

.single-profile .name-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, .7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.single-profile .name-wrapper span {
  color: white;
  font-size: 16px;
}

.new-profile {
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid #7942f8;
}

.new-profile img {
  width: 32px;
  height: 32px;
}



.registration-button {
  opacity: 0;
  transform: scale(0);
  transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  pointer-events: none;
}

.registration-button.active {
  opacity: 1;
  transform: scale(1);
  transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  pointer-events: all;
}

.menu-profile-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 20px 20px 20px;
}

.actual-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.actual-profile span {
  color: white;
}

.actual-profile img {
  width: 32px;
  height: 32px;
  border-radius: 1000px;
  object-fit: cover;
  object-position: center center;
}

.lb-button-wrapper img {
  width: 24px;
  filter: invert(1);
}

.leaderboard-scene {
  z-index: 99999;
  flex-direction: column;
  justify-content: flex-start;
  background: rgba(0, 0, 0, .75);
  backdrop-filter: blur(10px);
  padding: 40px 20px;
}

.leaderboard-scene .heading {
  font-size: 24px;
  color: white;
  margin-bottom: 40px;
}

.close-lb-wrapper {
  padding: 8px;
  position: fixed;
  top: 16px;
  left: 20px;
  z-index: 9999999;
  cursor: pointer;
  overflow: scroll;
}

.close-lb-wrapper img {
  width: 24px;
  height: 24px;
  filter: invert(1);
}



.lb-transition-enter {
  transform: translateY(100%);
  opacity: 0;
}

.lb-transition-enter-to {
  transform: translateY(0%);
  opacity: 1;
}

.lb-transition-enter-active {
  transition: all .3s ease-out;
}

.lb-transition-leave {
  transform: translateY(0%);
  opacity: 1;
}

.lb-transition-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.lb-transition-leave-active {
  transition: all .3s ease-in;
}

.leaderboard-users-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  overflow: scroll;
  padding: 0px 0px 120px 0px;
}

.start-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #14141E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  z-index: 99999999;
}

.loading-span-1 {
  animation-delay: 0s !important;
}

.loading-span-2 {
  animation-delay: 0.3s !important;
}

.loading-span-3 {
  animation-delay: 0.6s !important;
}

.loading-span-4 {
  animation-delay: 0.9s !important;
}

.loading-span-5 {
  animation-delay: 1.2s !important;
}

.loading-span-6 {
  animation-delay: 1.5s !important;
}

.loading-span-7 {
  animation-delay: 1.8s !important;
}

.loading-span-8 {
  animation-delay: 3s !important;
}

.start-scene span {
  color: white;
  font-size: 12px;
  font-weight: 400;
  transform: translateY(20px);
  opacity: 0;
  animation: scaleUp 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}


.start-scene .preload-logo span {
  color: white;
  font-size: 24px;
  font-weight: 1000;
  transform: translateY(20px);
  opacity: 0;
  animation: scaleUp 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}


@keyframes scaleUp {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }

  100% {
    transform: translateY(0px);
    opacity: 1;
  }

}
</style>
