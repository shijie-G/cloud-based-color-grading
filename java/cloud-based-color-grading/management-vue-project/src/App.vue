<script setup lang="ts">
// App.vue 作为应用的根组件
// 使用 router-view 来渲染路由匹配的组件
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
