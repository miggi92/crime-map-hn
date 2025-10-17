<template>
  <UPage>
    <UPageHeader title="Crime news Heilbronn" />

    <UPageBody>
      <UContainer>
        <UBlogPosts>
          <UBlogPost v-for="(post, index) in posts" :key="index" v-bind="post" />
        </UBlogPosts>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>

const news = await useAsyncData('news-posts', () => $fetch('/api/prp/news'))
const posts = computed(() => {
  return news.data.value.item.map((item: any) => ({
    title: item.title[0],
    description: item.description[0],
    link: item.link[0],
    pubDate: item.pubDate[0],
  }))
})

</script>

<style></style>