# 学院驾驶舱 · 会议改造配置与接口预留

## 配置文件（可热更新）

| 文件 | 用途 |
|------|------|
| `backend/scripts/config/benchmark_pillar_targets.yaml` | 精品成果五维目标 |
| `backend/scripts/config/phd_tracks.yaml` | 申博方向师资目标 |
| `backend/scripts/config/elite_programs.yaml` | 一流专业建设点 |
| `backend/scripts/config/student_rules.yaml` | 学业预警阈值 / 高潜规则位 |

## AI / 机器人钩子（精品成果二级「AI 深度挖掘」）

前端已预留：

- 刷新分析
- 导出报告（txt）
- 语音播报（浏览器 SpeechSynthesis）
- 机器人问答（占位提示）

后端 `diagnosis.aiReady=true`，`reportText` 可供后续对接大模型或数智助手。

## 学工对接

预警 1–3 级已由 `high/medium/low` 映射输出；阈值改 `student_rules.yaml` 即可。心理预警、部分高潜标签仍待学工真源。
