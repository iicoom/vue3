<script setup lang="ts">
import { ref, onMounted, computed  } from 'vue'
import type { Ref } from 'vue'
// @ts-ignore
import TCPlayer from 'tcplayer.js';
import 'tcplayer.js/dist/tcplayer.min.css';

const player: Ref<any> = ref(null)
const res: Ref<string> = ref('SD')
const options: Ref<any> = ref(null)
const dragVideo: Ref<boolean> = ref(false)

// method
function init(sources: any) {

  player.value = TCPlayer('player-container-id', {
    multiResolution:{
      sources,
      labels:{
        'SD':'标清','HD':'高清','FHD':'超清'
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

function handleClick(e: any) {
  // console.log(e.target.className)
  if (e.target.className === 'live_player_wrapper drag-video') {
    document.documentElement.scrollTop = 0
    dragVideo.value = false
  }
  if (dragVideo.value) player.value.play()
}


onMounted(() => {
  console.log(`the component is now mounted.`)

  // 监听调用方事件
  window.addEventListener('watchWebsocket',(options: any) => {
    console.log('options', options)
    if (!player.value) {
      init(options.detail)
    } else {
      player.value.src(options.detail[res.value][0].src)
    }
  })

  // 小窗处理逻辑
  window.addEventListener('scroll', handleDragVideo);

  // DEBUG 
  // const sources = {
  //   'SD':[
  //     {
  //       src: 'webrtc://5664.liveplay.myqcloud.com/live/5664_harchar1?txSecret=f22a813b284137ed10d3259a7b5c224b&txTime=6403f7bb',
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
})

</script>

<template>
  <div v-drag="dragVideo" :class="dragVideo?'live_player_wrapper drag-video':'live_player_wrapper'" @mousedown="handleClick">
    <video id="player-container-id" preload="auto" playsinline webkit-playsinline></video>
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
</style>
