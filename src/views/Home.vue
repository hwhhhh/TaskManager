<template>
  <div class="home">
    <Header/>
    <homeMain/>
  </div>
</template>

<script>
// @ is an alias to /src
import Header from '@/components/Header.vue';
import HomeMain from '@/components/HomeMain.vue'

export default {
  name: 'home',
  
  components: {
    Header, HomeMain
  },
  mounted() {
    
  },
  methods: {
      
  }
}
</script>
