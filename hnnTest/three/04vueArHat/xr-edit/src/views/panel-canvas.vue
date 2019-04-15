<template>
    <div id="panel-canvas"></div>
</template>

<script>
    import {InitEdit} from '@/libs/js/index.js'
    export default {
        name: "panel-canvas",
        mounted(){
            let oDiv=document.getElementById("panel-canvas")
            let globalObject=new InitEdit(oDiv)
            console.log('globalObject', globalObject)
            window.addEventListener('resize',globalObject.globalWindowResize.bind(globalObject),false)
        }
    }
</script>

<style scoped>
#panel-canvas{
    position: absolute;
    top: 0;
    right: 0;
    width: 80vw;
    height: 100vh;
    background-color: bisque;
}
</style>