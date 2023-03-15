<script setup lang="ts">
import { ref, onMounted, computed  } from 'vue'
import type { Ref } from 'vue'
// @ts-ignore
import TCPlayer from 'tcplayer.js';
import 'tcplayer.js/dist/tcplayer.min.css';

const player: Ref<any> = ref(null)
const res: Ref<string> = ref('SD')
const options: Ref<any> = ref(null)

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
    connectRetryCount: 3,
    connectRetryDelay: 1
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

onMounted(() => {
  console.log(`the component is now mounted.`)

  window.addEventListener('watchWebsocket',(options: any) => {
    console.log('options', options)
    if (!player.value) {
      init(options.detail)
    } else {
      player.value.src(options.detail[res.value][0].src)
    }
  })

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
  <div class="live_player_wrapper">
    <video id="player-container-id" preload="auto" playsinline webkit-playsinline></video>
  </div>
</template>

<style scoped>

</style>
