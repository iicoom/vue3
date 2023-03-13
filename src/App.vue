<script setup lang="ts">
import { ref, onMounted, computed  } from 'vue'
import type { Ref } from 'vue'
import flvjs from 'flv.js'
// @ts-ignore
import { dragElement } from './drag'



// ref
const showTool: Ref<boolean | number> = ref(false)
const playing: Ref<boolean> = ref(true)
const timer: Ref<number> = ref(0)
const ds = ref(['dan1', 'dan2', 'dan3', '...'])
const flvPlayer = ref({} as any)
const muted: Ref<boolean> = ref(true)
const showVoiceTip: Ref<boolean> = ref(true)

const slider_btn_bottom = computed(() => {
  return muted.value ? {"bottom": '0px'} : {"bottom": '120px'}
})
const slider_color_height = computed(() => {
  return muted.value ? {"height": '0px'} : {"height": '100%'}
})
const fullScreen: Ref<boolean> = ref(false);
const spin: Ref<boolean> = ref(false);
const definitions = ref([{label: '高清', type: 1, url: '123'}, {label: '超清', type: 2, url: '234'}]);


// reactive


// method
function handleVal(event: any) {
  console.log(event)
  ds.value.push(event.data)
}

function init(url: string) {
  if (flvjs.isSupported()) {
    let videoElement = <HTMLVideoElement> document.getElementById('videoElement');
    flvPlayer.value = flvjs.createPlayer({
      type: 'flv',
      url: url
    });
    flvPlayer.value.attachMediaElement(videoElement);
    flvPlayer.value.load();
    flvPlayer.value.play();

    flvPlayer.value._emitter.on('error', (e:any) => {
      // alert('直播资源不存在')
    })
  } else {
    alert('您的浏览器暂不支持当前直播协议')
  }

  // 背景虚化
  var v = <HTMLVideoElement> document.getElementById("videoElement");
  var canvas = <HTMLCanvasElement> document.getElementById("video-background");
  var context = canvas.getContext("2d");
  var cw = Math.floor(canvas.clientWidth);
  var ch = Math.floor(canvas.clientHeight);
  canvas.width = cw;
  canvas.height = ch;
  draw(v, context, cw, ch);
  // @ts-ignore
  function draw(v, c, w, h) {
    c.drawImage(v, 0, 0, w, h);
    setTimeout(draw, 20, v, c, w, h);
  }
 
  // TODO 节流
  v?.addEventListener('mousemove', function () {
    showTool.value = true
    clearTimeout(timer.value)
    timer.value = setTimeout(() => {
      showTool.value = false
    }, 2000)
  })

  document.querySelector('#tool')?.addEventListener('mouseover', function () {
    clearTimeout(timer.value)
  })

  document.querySelector('#tool')?.addEventListener('mouseout', function () {
    timer.value = setTimeout(() => {
      showTool.value = false
    }, 2000)
  })

  // voice slider
  const container = document.querySelector('.slider_bar');
  const btn = document.querySelector('.slider_btn');
  const color = document.querySelector('.slider_color');
  const tooltip = document.querySelector('.slider_tooltip');

  dragElement(container, btn, color, tooltip, v);

  document.querySelector('.volume_wrapper')?.addEventListener('mouseenter', function (e) {
    document.querySelector('.volume_wrapper')?.classList.add('show_slide')
  })
  document.querySelector('.volume_wrapper')?.addEventListener('mouseleave', function (e) {
    document.querySelector('.volume_wrapper')?.classList.remove('show_slide')
  })

  document.querySelector('.definition_wrapper')?.addEventListener('mouseenter', function() {
    document.querySelector('.definition_wrapper')?.classList.add('show_pan')
  })
  document.querySelector('.definition_wrapper')?.addEventListener('mouseleave', function() {
    document.querySelector('.definition_wrapper')?.classList.remove('show_pan')
  })
}

function refresh() {
  flvPlayer.value.unload()
  spin.value = true
  flvPlayer.value.load()
  setTimeout(() => {
    flvPlayer.value.play()
    spin.value = false
  }, 1500)
}

function handleVoice(val: boolean) {
  let videoElement = <HTMLVideoElement> document.getElementById('videoElement');
  videoElement.muted = val
  muted.value = val
  showVoiceTip.value = false
}

function togglePlay() {
  let videoElement = <HTMLVideoElement> document.getElementById('videoElement');
  if (playing.value) {
    playing.value = false
    videoElement.pause()
  } else {
    playing.value = true
    videoElement.play()
  }
}
function handlePlay() {
  playing.value = true
  flvPlayer.value.play()
}
function handlePause() {
  playing.value = false
  flvPlayer.value.pause()
}


function toggleFullScreen() {
  let videoElement = <HTMLVideoElement> document.querySelector('.video-box');
  if (!fullScreen.value) {
    videoElement.requestFullscreen();
  } else {

  }
}

function changeDefinition(val: string) {
  flvPlayer.value._mediaDataSource = val
  refresh()
} 


onMounted(() => {
  console.log(`the component is now mounted.`)
  // TODO remove
  init('https://pull-flv-l26.douyincdn.com/third/stream-112655515716420070_sd.flv?expire=64183817&sign=737a4b2221d977416d20f9fa205aa86c&session_id=037-2023031318402344330B2563D7270D64D9&abr_pts=-1800')

  window.addEventListener('watchWebsocket',(options: any) => {
    console.log('options', options)
    init(options.detail.url)
  })
})

</script>

<template>
  <div class="live_player_wrapper">
    <canvas id="video-background"></canvas>
    <div class="video-box" @click="togglePlay">
      <video id="videoElement" muted autoplay width="100%" height="100%"></video>
    </div>
    <div :class="showTool ? 'tool ani' : 'tool'" id="tool">
      <div class="left">
        <img v-show="playing" src="./pause.png" alt="" id="play" @click="handlePause">
        <img v-show="!playing" src="./play.png" alt="" id="pause" @click="handlePlay">
        <img v-if="spin" src="./refresh.png" alt="" id="refresh" class="spin">
        <img v-else src="./refresh.png" alt="" id="refresh" @click="refresh">
      </div>
      <div class="right">
        <div class="definition_wrapper">
          清晰度
          <div class="definition_bg">
            <div class="definition_list">
              <div v-for="item in definitions" class="option" @click="changeDefinition(item.url)">{{item.label}}</div>
            </div>
          </div>
        </div>
        <div class="volume_wrapper">
          <img v-if="muted" src="./volume_off.png" alt="" class="volume_icon">
          <img v-else src="./volume_on.png" alt="" class="volume_icon">
          <div class="slider_bg">
            <div class="slider">
              <div class="slider_bar">
                <div class="slider_btn" :style="slider_btn_bottom"></div>
                <div class="slider_color" :style="slider_color_height"></div>
                <div class="slider_tooltip" :style="slider_btn_bottom">{{ muted?0:100 }}</div>
              </div>
            </div>
          </div>
        </div>
        <img src="./full.png" alt="" @click="toggleFullScreen">
      </div>
    </div>
    <div v-if="showVoiceTip" class="voice_tip">
      <div class="voice_btn_group">
        <div class="voice_btn" @click="handleVoice(false)">
          <img src="./volume_on.png"/>
          <strong>打开声音</strong>
        </div>
        <strong>|</strong>
        <div class="voice_btn" @click="handleVoice(true)">
          <img src="./volume_off.png"/>
          <strong>静音观看</strong>
        </div>
      </div>
    </div>
    <div v-if="!playing" class="center_play_btn" @click="handlePlay">
      <img src="./play.png" alt="" id="pause">
    </div>
  </div>
</template>

<style scoped>
.spin {
  animation: rotate 1s;
}

@keyframes rotate {
  0% {
      transform: rotate(0deg);
  }
  100% {
      transform: rotate(360deg);
  }
}
</style>
