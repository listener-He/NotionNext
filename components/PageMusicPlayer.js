import { siteConfig } from '@/lib/config'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

/**
 * 页面专用音乐播放器
 * 不受全局音乐播放器设置影响，当页面有musicId属性时显示
 * @param {object} props - 组件属性
 * @param {string} props.musicId - 音乐ID
 * @returns {JSX.Element|null}
 */
const PageMusicPlayer = ({ musicId }) => {
  const [isClient, setIsClient] = useState(false)
  const [librariesLoaded, setLibrariesLoaded] = useState(false)
  const ref = useRef(null)

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !musicId || musicId === '') {
    return <div className="page-music-player-placeholder" style={{ display: 'none' }} suppressHydrationWarning />
  }
  // 加载必要的库
  useEffect(() => {
    if (!isClient) return

    const loadLibraries = async () => {
      try {
        await loadExternalResource('https://cdn.jsdelivr.net/npm/aplayer@1.10.0/dist/APlayer.min.css', 'css')
        await loadExternalResource('https://cdn.jsdelivr.net/npm/aplayer@1.10.0/dist/APlayer.min.js', 'js')
        const musicMetingCDNUrl = siteConfig(
          'MUSIC_PLAYER_METING_CDN_URL',
          'https://cdnjs.cloudflare.com/ajax/libs/meting/2.0.1/Meting.min.js'
        )
        await loadExternalResource(musicMetingCDNUrl, 'js')
        setLibrariesLoaded(true)
      } catch (error) {
        console.error('页面音乐播放器库加载异常', error)
      }
    }

    loadLibraries()
  }, [isClient])

  const api = siteConfig(
    'MUSIC_PLAYER_METING_API',
    'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r'
  )
  const server = siteConfig('MUSIC_PLAYER_METING_SERVER', 'netease')
  const type = 'song'


  return (
    <div className="page-music-player w-full my-4" suppressHydrationWarning>
      {librariesLoaded && (
        <meting-js
          ref={ref}
          fixed='false'
          type={type}
          preload='auto'
          api={api}
          autoplay='true'
          order='list'
          server={server}
          id={musicId}
        />
      )}

      <style jsx>{`
        .page-music-player {
          display: flex;
          justify-content: center;
          animation: fadeIn 0.5s ease-in;
        }
        
        .aplayer-container {
          width: 100%;
          max-width: 500px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        
        .aplayer-container:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* 美化APlayer默认样式 */
        .aplayer {
          border-radius: 12px;
        }
        
        .aplayer .aplayer-info {
          padding: 12px 15px;
        }
        
        .aplayer .aplayer-controller {
          padding: 0 15px 15px;
        }
        
        .aplayer .aplayer-pic {
          border-radius: 12px 0 0 12px;
        }
        
        .aplayer.aplayer-withlrc .aplayer-pic {
          height: 90px;
          width: 90px;
        }
        
        .aplayer.aplayer-withlrc .aplayer-info {
          padding: 10px 15px;
        }
        
        .aplayer .aplayer-info .aplayer-music .aplayer-title {
          font-weight: 600;
          font-size: 16px;
        }
        
        .aplayer .aplayer-info .aplayer-music .aplayer-author {
          font-size: 13px;
          color: #888;
        }
        
        .aplayer .aplayer-lrc:before,
        .aplayer .aplayer-lrc:after {
          background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%);
        }
      `}</style>
    </div>
  )
}

export default PageMusicPlayer
