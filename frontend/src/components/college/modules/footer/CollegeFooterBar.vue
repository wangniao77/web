<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const route = useRoute()
const router = useRouter()

const items = [
  { label: '院情总览', icon: 'icon-influence', route: ROUTES.college.root },
  { label: '重点任务', icon: 'icon-target', route: ROUTES.college.keyTasks },
  { label: '教学运行', icon: 'icon-education', route: ROUTES.college.teachingCourses },
  { label: '学生发展', icon: 'icon-people', route: ROUTES.college.studentEmployment },
  { label: '科研创新', icon: 'icon-research', route: ROUTES.college.researchPlatforms },
  { label: '预警监测', icon: 'icon-warning', route: ROUTES.college.warning('academic') },
  { label: '高潜发展', icon: 'icon-star', route: ROUTES.college.highPotential('academic') },
  { label: '设置管理', icon: 'icon-platform', route: ROUTES.college.root },
]

function isActive(path: string, index: number) {
  if (path === ROUTES.college.root) {
    return route.path === path && index === 0
  }
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="cockpit-nav" aria-label="驾驶舱导航">
    <button
      v-for="(item, index) in items"
      :key="item.label"
      type="button"
      class="cockpit-nav__item"
      :class="{ 'cockpit-nav__item--active': isActive(item.route, index) }"
      @click="navigate(item.route)"
    >
      <span class="cockpit-nav__icon">
        <svg aria-hidden="true"><use :href="`/icons.svg#${item.icon}`" /></svg>
      </span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.cockpit-nav__icon svg {
  width: 18px;
  height: 18px;
  color: inherit;
}
</style>
