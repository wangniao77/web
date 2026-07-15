import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, createReadStream, statSync, readdirSync } from 'fs'
import { resolve, extname, join } from 'path'

/** 学籍照片物理目录（姓名照片对应表.csv → photos/） */
const STUDENT_PHOTOS_DIR =
  process.env.STUDENT_PHOTOS_DIR ||
  resolve('C:/Users/24603/Desktop/学生学籍照片清洗结果_完整原图嵌入版/photos')

const MIME: Record<string, string> = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function studentPhotosPlugin(photoDir: string): Plugin {
  return {
    name: 'student-photos-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        if (!rawUrl.startsWith('/student-photos/')) {
          next()
          return
        }

        const pathOnly = decodeURIComponent(rawUrl.split('?')[0] || '')
        const name = pathOnly.replace(/^\/student-photos\//, '').replace(/\\/g, '/')
        if (!name || name.includes('..') || name.includes('/')) {
          res.statusCode = 400
          res.end('bad photo name')
          return
        }

        let filePath = join(photoDir, name)
        if (!existsSync(filePath)) {
          const sid = name.replace(/\.(jpe?g|png|webp)$/i, '')
          try {
            const hit = readdirSync(photoDir).find((f) => f.startsWith(`${sid}_`) || f.startsWith(`${sid}.`))
            if (hit) filePath = join(photoDir, hit)
          } catch {
            /* ignore */
          }
        }

        if (!existsSync(filePath)) {
          res.statusCode = 404
          res.end('photo not found')
          return
        }

        const ext = extname(filePath).toLowerCase()
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        try {
          res.setHeader('Content-Length', String(statSync(filePath).size))
        } catch {
          /* ignore */
        }
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), studentPhotosPlugin(STUDENT_PHOTOS_DIR)],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens.scss" as *;\n`,
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    fs: {
      allow: [resolve(__dirname), STUDENT_PHOTOS_DIR],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
