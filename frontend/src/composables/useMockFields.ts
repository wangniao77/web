/** 根据后端返回的 mockFields 判断字段是否为示意数据。
 * 规则：精确匹配，或查询路径是已标记字段的子路径（标记父级则子级全 mock）。
 */
export function isMockField(mockFields: string[] | undefined | null, path: string): boolean {
  if (!mockFields?.length || !path) return false
  return mockFields.some((f) => f === path || path.startsWith(`${f}.`))
}
export function useMockFields(getFields: () => string[] | undefined | null) {
  return {
    isMock: (path: string) => isMockField(getFields(), path),
  }
}
