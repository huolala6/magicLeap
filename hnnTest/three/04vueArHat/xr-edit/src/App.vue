<template>
  <div id="app">
      <!--组件-->
    <edit></edit>
    <PanelCanvas></PanelCanvas>
  </div>
</template>

<script>
  import Edit from '@/views/edit'
  import PanelCanvas from '@/views/panel-canvas'
  export default {
      name: "app",
      components:{
          Edit,
          PanelCanvas
      }
  }
</script>

<style lang="less">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
