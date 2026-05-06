<template>
  <UPage>
    <UPageHeader title="Crime news Heilbronn" />

    <UPageBody>
      <UContainer>
        <UBlogPosts>
          <UBlogPost v-for="(post, index) in posts" :key="index" v-bind="post" :to="post.link" target="_blank" />
        </UBlogPosts>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>

const news = await useAsyncData('news-posts', () => $fetch('/api/prp/news'))
const posts = computed(() => {
  return news.data.value.item
})

</script>

<style></style>