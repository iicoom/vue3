<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch  } from 'vue'
import type { Ref } from 'vue'
// @ts-ignore
import TCPlayer from 'tcplayer.js';
import 'tcplayer.js/dist/tcplayer.min.css';
import vueDanmaku from 'vue3-danmaku'
import { ElSlider, ElPopover } from 'element-plus'
import 'element-plus/es/components/slider/style/css'

const player: Ref<any> = ref(null)
const res: Ref<string> = ref('SD')
const options: Ref<any> = ref(null)
const dragVideo: Ref<boolean> = ref(false)
// 弹幕
const danmus: any = ref([])
const num = ref(100)
const channels: any = ref(0)
const danmakuRef: any = ref(null)
const opacity = ref(1)
const fontSize = ref(22)
const speed = ref(150)
type Marks = Record<number,string>
const marks = reactive<Marks>({
  0: '1/4屏', // 7
  33: '半屏', // 14
  66: '3/4屏',// 21
  100: '全屏' // 0
})
const m = new Map([
  [0, 7],
  [33, 14],
  [66, 21],
  [100, 0],
])
const wrapper = ref()

// 监听弹幕轨道变化
watch(
  () => num.value,
  (val, prev) => {
    mark2Channels(val)
  }
)
function mark2Channels(mark_val: any) {
  channels.value = m.get(mark_val)
}

const popStyle = {
  backgroundColor: 'rgba(0,0,0,.7)',
  padding: '10px 15px 30px 15px',
  border: 'none',
  color: '#ccc',
  zIndex: 100001
}

function receiveDan(val: any) {
  // danmakuRef.value?.insert(val)
  danmakuRef.value?.push(val)
}

// method
function init(sources: any) {
  console.log('=========================', sources)
  player.value = TCPlayer('player-container-id', {
    multiResolution:{
      sources,
      labels:{
        'SD':'标清','HD':'高清','FHD':'原画'
      },
      showOrder:['SD','HD','FHD'],
      defaultRes: 'SD'
    },
    autoplay: true,
    controlBar: {
      // playToggle: false
    },
    webrtcConfig: {
      connectRetryCount: 3,
      connectRetryDelay: 1,
    }
  });
  player.value.on('error', function(error: any) {
    // 做一些处理
    console.log('error:', error)
    player.value.src(options.value[res.value][0].src)
  });
  player.value.on('resolutionswitched', function(val: any) {
    console.log('【resolutionswitched:】', val)
    res.value = val.data.id
  });

  // 竖版直播背景虚化
  if (sources.liveType === 2) {
    var v = <HTMLVideoElement> document.getElementsByTagName("video")[0];
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
  }

  // player.src(flv); // url 播放地址
}

// Custom Directives
const vDrag = {
  mounted(el: any, binding: any) {},
  updated(el: any, binding: any) {
     // 兼容不同浏览器
     function getInner() {
      if (typeof innerHeight == 'undefined') {
          //IE浏览器适用
          return {
              w: document.documentElement.clientWidth,
              h: document.documentElement.clientHeight
          }
      } else {
          //非IE浏览器适用
          return {
              w: innerWidth,
              h: innerHeight
          }
      }
    }

    // 处理指定元素拖动逻辑
    if (binding.value) {
      let dragBox = el
      dragBox.onmousedown = (e: any) => {
        // console.log(e.target.className)
        // @ts-ignore
        if (e.target.className === 'vjs-tech') document.querySelector('#player-container-id_html5_api')?.play()
        // if (e.target.className !== 'vjs-tech') return
        e.preventDefault();
        let event = e || window.event;
        //算出鼠标相对元素的位置
        let disX = event.clientX - dragBox.offsetLeft;
        let disY = event.clientY - dragBox.offsetTop;
        document.onmousemove = (e) => {
          e.preventDefault();
          let event = e || window.event;
          //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
          let left = event.clientX - disX;
          let top = event.clientY - disY;
          //左右边界限定
          if (left <= 0) {
              left = 0
          } else if (left >= getInner().w - dragBox.offsetWidth - 20) {
              //元素在最右边时的判定，屏幕的宽度减去元素自身的宽度
              left = getInner().w - dragBox.offsetWidth - 20;
          }
          //上下边界限定
          if (top <= 67) {
              top = 67;
          } else if (top >= getInner().h - dragBox.offsetHeight) {
              //元素在最下边时的判定，屏幕的高度减去元素自身的高度
              top = getInner().h - dragBox.offsetHeight;
          }
          //移动当前元素
          dragBox.style.left = left + 'px';
          dragBox.style.top = top + 'px';
        }

        document.onmouseup = (e) => {
          e.preventDefault();
          //鼠标弹起来的时候不再移动
          document.onmousemove = null;
          //预防鼠标弹起来后还会循环（即预防鼠标放上去的时候还会移动）
          document.onmouseup = null;
        };
      }
    } else {
      el.onmousedown = null;
      document.onmousemove = null;
      document.onmouseup = null;
    }
  },
}

function handleDragVideo() {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop // 滚动条偏移量
  const videoDiv = document.getElementById('player-container-id');
  if (scrollTop > 500) {
    videoDiv?.setAttribute('style', 'height: 225px !important');
    dragVideo.value = true;
  } else if (scrollTop <= 500) {
    // this.handleCloseSmallVideo('scroll', videoDiv);
    videoDiv?.setAttribute('style', '');
    videoDiv?.parentElement?.setAttribute('style', '');
    dragVideo.value = false;
  }
}

function handleDivScroll(e: any) {
  let scrollTop = e.target.scrollTop
  const videoDiv = document.getElementById('player-container-id');

  if (scrollTop > 500) {
    videoDiv?.setAttribute('style', 'height: 225px !important');
    dragVideo.value = true;
  } else if (scrollTop <= 500) {
    videoDiv?.setAttribute('style', '');
    videoDiv?.parentElement?.setAttribute('style', '');
    dragVideo.value = false;
  }
}

// 和PC相关联 在这里调试会报错
function handleClick(e: any) {
  // console.log(e.target.className)
  if (e.target.className === 'live_player_wrapper drag-video') {
    // @ts-ignore
    document.getElementById('live_left').scrollTop = 0
    dragVideo.value = false
  }
}


onMounted(() => {
  console.log(`the component is now mounted.`)

  // 监听调用方事件
  window.addEventListener('watchWebsocket',(options: any) => {
    // console.log('options', options)
    danmakuRef.value?.resize()
    danmakuRef.value?.stop()
    danmakuRef.value?.play()
    if (!player.value) {
      init(options.detail)
      handlePlayer()
    } else {
      player.value.src(options.detail[res.value][0].src)
    }
  })

  // 监听聊天室弹幕推送
  window.addEventListener('danReceive', (data: any) => {
    receiveDan(data.detail.data)
  })

  // 小窗处理逻辑
  // window.addEventListener('scroll', handleDragVideo); // 在本项目调试打开
  document.querySelector('#live_left')?.addEventListener('scroll', handleDivScroll) // 适用于PC

  // DEBUG 
  // const sources = {
  //   'SD':[
  //     {
  //       src: 'webrtc://5664.liveplay.myqcloud.com/live/5664_harchar1?txSecret=f22a813b284137ed10d3259a7b5c224b&txTime=6403f7bb',
  //       // src: 'https://dev-liveplay.foundingaz.com/live/dev_fhxn.flv?txSecret=7df288fb7a3838189508d97852e0162a&txTime=64b63c3d',
  //     }
  //   ],
  //   'HD':[
  //     {
  //       src: 'webrtc://5664.liveplay.myqcloud.com/live/5664_harchar1?txSecret=f22a813b284137ed10d3259a7b5c224b&txTime=6403f7bb',
  //     }
  //   ],
  //   'FHD':[
  //     {
  //       src: 'webrtc://5664.liveplay.myqcloud.com/live/5664_harchar1?txSecret=f22a813b284137ed10d3259a7b5c224b&txTime=6403f7bb',
  //     }
  //   ]
  // };
  // init(sources)
  // handlePlayer()
  // for(let i=0;i<1000;i++) {
  //   danmus.value.push(`弹幕来咯。。。${i}`)
  // }
})

// 处理播放器自定义内容
function handlePlayer() {
  // 弹幕&全屏相关功能
  const target = document.querySelector('.live_player_wrapper')
  const fullScreenBtn: any = document.querySelector('.vjs-fullscreen-control')
  const danSwitch = document.querySelector('.xgplayer-icon')
  const parentNode = fullScreenBtn?.parentNode
  
  // 重写全屏按钮 处理全屏事件
  const new_element: any = fullScreenBtn?.cloneNode(true);
  parentNode?.replaceChild(new_element, fullScreenBtn);
  const videoDiv = document.getElementById('player-container-id');
  new_element?.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      target?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      new_element.classList.add('on')

      // 处理小窗全屏
      videoDiv?.setAttribute('style', '');
      videoDiv?.parentElement?.setAttribute('style', '');
      dragVideo.value = false;
    } else {
      document.exitFullscreen();
      new_element.classList.remove('on')
    }
  })
  document.addEventListener("fullscreenchange", function() {
    // danmakuRef.value.hide()
    // danmakuRef.value.show()
    danmakuRef.value.resize()
    if (document.fullscreenElement) {
      // console.log(`Element: ${document.fullscreenElement.id} entered fullscreen mode.`);
    } else {
      // console.log("Leaving fullscreen mode.");
      new_element.classList.remove('on')
    }
  });

  // 插入弹幕开关 处理点击状态切换
  parentNode?.insertBefore(danSwitch, new_element)
  const dan = document.querySelector('.dan')
  danSwitch?.addEventListener('click', function() {
    if(danSwitch.classList.contains('on')) {
      danSwitch.classList.remove('on')
    } else {
      danSwitch.classList.add('on')
    }

    if(dan?.classList.contains('on')) {
      dan.classList.remove('on')
    } else {
      dan?.classList.add('on')
    }
  })

  const danSetting = document.querySelector('.dan-setting')
  parentNode?.insertBefore(danSetting, new_element)

  // 从localStorage读取用户弹幕配置
  const setting = localStorage.getItem('dan_setting')
  if (setting) {
    const obj = JSON.parse(setting)
    channels.value = obj.channels
    opacity.value = obj.opacity
    fontSize.value = obj.fontSize
    speed.value = obj.speed
  }

  wrapper.value = document.querySelector('.live_player_wrapper')
}

// 弹幕设置弹框关闭后保存到localStorage
function handleSave() {
  const dan_setting = {
    channels: channels.value,
    opacity: opacity.value,
    fontSize: fontSize.value,
    speed: speed.value,
  }
  localStorage.setItem('dan_setting', JSON.stringify(dan_setting))
}

</script>

<template>
  <div v-drag="dragVideo" :class="dragVideo?'live_player_wrapper drag-video':'live_player_wrapper'" @mousedown="handleClick">
    <canvas id="video-background"></canvas>
    <video id="player-container-id" preload="auto" playsinline webkit-playsinline></video>
    <vue-danmaku 
      v-model:danmus="danmus" 
      :loop="false"
      :channels="channels"
      :fontSize="fontSize"
      :speeds="speed"
      :extraStyle="`color: rgba(220,220,220,${opacity})`"
      randomChannel
      isSuspend
      class="dan on"
      ref="danmakuRef"
    >
    </vue-danmaku>

    <div class="xgplayer-icon">
      <svg width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29 10.29a2 2 0 012-2h10.693a2 2 0 012 2v5.404a5.55 5.55 0 00-2.472-.55v-2.871a.6.6 0 00-.6-.6h-.772l.322-.478a.6.6 0 00-.996-.67l-.772 1.148h-.317l-.772-1.148a.6.6 0 10-.995.67l.321.478h-.774a.6.6 0 00-.6.6v3.772a.6.6 0 00.6.6h1.609a5.603 5.603 0 00-.625.69h-1.463a.6.6 0 100 1.2h.763a5.554 5.554 0 00-.443 2.181c0 .76.152 1.484.428 2.144h-5.136a2 2 0 01-2-2V10.29zm11.021 4.997a5.56 5.56 0 00-.552.158h-.626v-.684h1.178v.526zm-9.034-3.955a.6.6 0 01.6-.6h2.377a.6.6 0 01.6.6v2.83a.6.6 0 01-.6.6h-1.777v1.157h1.777a.6.6 0 01.6.6v3.3a.6.6 0 01-.6.6h-2.377a.6.6 0 010-1.2h1.777v-2.1h-1.777a.6.6 0 01-.6-.6V14.16a.6.6 0 01.6-.6h1.777v-1.629h-1.777a.6.6 0 01-.6-.6zm5.48 4.113v-.684h1.176v.684h-1.177zm0-1.884h1.176v-.688h-1.177v.688zm2.376 0h1.178v-.688h-1.178v.688z" fill="#fff"></path>
        <path d="M24.423 20.715a3.857 3.857 0 11-7.714 0 3.857 3.857 0 017.714 0z" fill="#fff"></path>
        <path d="M18.802 20.5l1.384 1.502 2.214-2.38" stroke="#FE2C55" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <svg width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29 10.29a2 2 0 012-2h10.693a2 2 0 012 2v5.404a5.55 5.55 0 00-2.472-.55v-2.871a.6.6 0 00-.6-.6h-.772l.322-.478a.6.6 0 00-.996-.67l-.772 1.148h-.317l-.772-1.148a.6.6 0 10-.995.67l.321.478h-.774a.6.6 0 00-.6.6v3.772a.6.6 0 00.6.6h1.609a5.602 5.602 0 00-.625.69h-1.463a.6.6 0 100 1.2h.763a5.554 5.554 0 00-.443 2.181c0 .76.152 1.484.428 2.144h-5.136a2 2 0 01-2-2V10.29zm11.021 4.997a5.535 5.535 0 00-.552.158h-.626v-.684h1.178v.526zm-9.034-3.955a.6.6 0 01.6-.6h2.377a.6.6 0 01.6.6v2.83a.6.6 0 01-.6.6h-1.777v1.157h1.777a.6.6 0 01.6.6v3.3a.6.6 0 01-.6.6h-2.377a.6.6 0 010-1.2h1.777v-2.1h-1.777a.6.6 0 01-.6-.6V14.16a.6.6 0 01.6-.6h1.777v-1.629h-1.777a.6.6 0 01-.6-.6zm5.48 4.113v-.684h1.176v.684h-1.177zm0-1.884h1.176v-.688h-1.177v.688zm2.376 0h1.178v-.688h-1.178v.688z" fill="#fff" fill-opacity="0.9"></path>
        <circle cx="20.566" cy="20.716" r="3.855" fill="#fff" fill-opacity="0.9"></circle><path fill-rule="evenodd" clip-rule="evenodd" d="M21.613 22.826a2.355 2.355 0 01-3.157-3.157l3.157 3.157zm1.061-1.06l-3.158-3.159a2.355 2.355 0 013.159 3.159zm1.747-1.05a3.855 3.855 0 11-7.71 0 3.855 3.855 0 017.71 0z" fill="#FE2C55"></path>
      </svg>
    </div>
    <el-popover
      :append-to="wrapper"
      :popper-style="popStyle"
      title=""
      :width="250"
      :show-arrow="false"
      placement="top-end"
      @hide="handleSave"
    >
      <template #reference>
        <div class="dan-setting">
          <svg t="1685010468728" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9281" width="20" height="20"><path d="M452.007 890.138H195.155C124.377 890.138 67 833.575 67 763.8V211.338C67 141.563 124.376 85 195.155 85h560.4c70.777 0 128.155 56.563 128.155 126.338v222.517a34.951 34.951 0 0 1-33.776 34.961c-19.64 0.531-35.731-15.006-35.731-34.248v-223.23c0-31.93-26.258-57.815-58.647-57.815h-560.4c-32.391 0-58.647 25.885-58.647 57.815v552.46c0 31.93 26.256 57.815 58.647 57.815h256.128c18.936 0 34.944 14.636 35.463 33.3 0.539 19.357-15.221 35.225-34.74 35.225zM656.942 733.006c-0.125 37.346 30.484 67.72 68.367 67.842s68.691-30.052 68.817-67.4-30.484-67.718-68.367-67.842h-0.225c-37.817-0.057-68.516 30.118-68.575 67.4h-0.018z" p-id="9282" fill="#ffffff"></path><path d="M276.373 298.23H410.86v144.237h-82.7c-0.456 18.313-0.913 36.625-1.826 53.589h84.069s-0.456 13.852-0.913 20.544c-4.544 99.588-10 142.007-23.174 156.74a46.515 46.515 0 0 1-34.07 18.313 415.3 415.3 0 0 1-54.981 0.9 115.861 115.861 0 0 0-16.423-51.359c19.544 1.332 38.174 1.8 47.261 1.8a21.3 21.3 0 0 0 15.913-4.912c6.825-7.591 11.368-33.945 15-96.457h-81.784c3.649-38.408 5.912-98.689 5.912-146.469h75.874v-49.561h-82.7z m338.608 322.833h-34.178v75.015H524.91v-75.015H411.773v-46H524.91v-26.785h-89.506V374.612h122.679a531.764 531.764 0 0 0 46.35-95.559l54.525 15.182a841.373 841.373 0 0 1-46.35 80.376h61.787v173.721h-93.592v26.787h62.224zM492.72 371.428a504.028 504.028 0 0 0-41.8-71.452l43.174-19.645a498.936 498.936 0 0 1 43.168 67.874z m-8.175 70.157h40.437v-25.9h-40.51z m40.437 65.192v-26.785h-40.51v26.785z m98.137-91.1h-42.267v25.9h42.263z m0 64.311h-42.267v26.787h42.263z" p-id="9283" fill="#ffffff"></path><path d="M816.01 609.235l61.449 104.925a33.832 33.832 0 0 1 0 34.261L816.01 853.346a34.847 34.847 0 0 1-30.1 17.131h-122.9a34.847 34.847 0 0 1-30.1-17.131l-61.443-104.925a33.832 33.832 0 0 1 0-34.261l61.45-104.925a34.846 34.846 0 0 1 30.1-17.13h122.9a34.846 34.846 0 0 1 30.093 17.13z m-10.032-85.652h-163.03a69.7 69.7 0 0 0-60.2 34.261l-81.511 139.185a67.68 67.68 0 0 0 0 68.522l81.514 139.186a69.7 69.7 0 0 0 60.2 34.261h163.03a69.7 69.7 0 0 0 60.194-34.261l81.516-139.186a67.684 67.684 0 0 0 0-68.522l-81.518-139.186a69.7 69.7 0 0 0-60.195-34.26z" p-id="9284" fill="#ffffff"></path></svg>
        </div>
      </template>
      <template #default>
        <div>
          <div class="slider-demo-block">
            <span class="demonstration">不透明度</span>
            <el-slider v-model="opacity" :min="0.1" :max="1" :step="0.1" :show-tooltip="false"/>
          </div>
          <div class="slider-demo-block">
            <span class="demonstration">字号缩放</span>
            <el-slider v-model="fontSize" :min="12" :max="80" :show-tooltip="false"/>
          </div>
          <div class="slider-demo-block">
            <span class="demonstration">弹幕速度</span>
            <el-slider v-model="speed" :min="30" :max="400" :show-tooltip="false"/>
          </div>
          <div class="slider-demo-block">
            <span class="demonstration">显示区域</span>
            <el-slider v-model="num" :marks="marks" show-stops :step="33" :show-tooltip="false"/>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<style scoped>
.drag-video {
  position: fixed;
  top: 35%;
  left: 55%;
  width: 400px !important;
  height: 225px;
  z-index: 100000;
  cursor: move;
}
.drag-video::after {
  content: url(./back.png);
  position: absolute;
  right: 5px;
  top: 5px;
  transform: scale(0.2);
  transform-origin: 100% 0;
  cursor: pointer;
  z-index: 4;
}
@media only screen and (max-width: 768px){
  .drag-video {
    left: initial;
    top: initial;
    width: 70%!important;
    bottom: 100px;
    height: 225px;
    right: 0;
  }
}

.dan {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  display: none;
  z-index: 2;
  pointer-events: none;
}
.dan.on {
  display: block;
}
.dan-setting {
  width: 19px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.xgplayer-icon {
  overflow: hidden;
  padding-top: 2px;
  cursor: pointer;
  width: 36px;
}
.xgplayer-icon svg {
  position: relative;
  top: 0px;
}
.xgplayer-icon.on svg {
  top: -38px;
}
#live_player_wrapper {
  position: relative;
}
#player-container-id:deep(.vjs-fullscreen-control.on .vjs-icon-placeholder:before) {
    content: "\f109";
}

.slider-demo-block {
  display: flex;
  align-items: center;
}
.slider-demo-block .demonstration {
  font-size: 14px;
  width: 100px;
}
.slider-demo-block .el-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
