import { siteConfig } from '@/lib/config'
import { loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'

/**
 * Coze-AI机器人
 * @returns
 */
export default function Coze() {
  const cozeSrc = siteConfig(
    'COZE_SRC_URL',
    'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js'
  )
  const title = siteConfig('COZE_TITLE', 'Honesty')
  const botId = siteConfig('COZE_BOT_ID')
  const token = siteConfig('COZE_BOT_TOKEN')

  const loadCoze = async () => {
    await loadExternalResource(cozeSrc).then(() => {
      if (window?.CozeWebSDK) {
        new CozeWebSDK.WebChatClient({
          config: {
            bot_id: botId,
          },
          componentProps: {
            title: title,
          },
          auth: {
            type: 'token',
            token: token,
            onRefreshToken: function () {
              return token
            }
          }
        });
      }

    })
  }

  useEffect(() => {
    if (!botId) {
      return
    }
    loadCoze().catch(e => {
      console.error('load coze error', e)
    })
  }, [])
  return <></>
}
