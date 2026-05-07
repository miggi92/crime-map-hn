<template>
  <UPage>
    <UPageHeader title="Crime news Heilbronn" />

    <UPageBody>
      <UContainer>
        <UBlogPosts>
          <UBlogPost
            v-for="(post, index) in posts"
            :key="index"
            :to="post.to"
            :target="post.target"
            v-bind="post"
          />
        </UBlogPosts>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>

const news = await useAsyncData('news-posts', () => $fetch('/api/prp/news'))
const posts = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (news.data.value?.item || []).map((post: any) => {
    const articleId = String(post.guid || post.link || '').match(/(\d+)$/)?.[1] || ''

    return {
      ...post,
      to: articleId ? `/news/${articleId}` : post.link,
      target: articleId ? undefined : '_blank',
    }
  })
})

</script>

<style></style>