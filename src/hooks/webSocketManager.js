import React, { useRef } from 'react'

function useWebSocketManager() {
  const socketRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const backoffTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const isManuallyClosedRef = useRef(false)

  const connect = async ({
    getUrlFn,
    onOpen,
    onMessage,
    onError,
    onClose,
    maxAttempts = 6,
  }) => {
    if (socketRef.current) return

    const url = await getUrlFn()

    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
      onOpen?.()

      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = setInterval(() => {
        try {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: 'ping' }))
        } catch (e) {}
      }, 25_000)
    }

    ws.onmessage = (ev) => {
      onMessage?.(ev)
    }

    ws.onerror = (ev) => {
      onError?.(ev)
    }

    ws.onclose = (ev) => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      socketRef.current = null
      onClose?.(ev)

      if (isManuallyClosedRef.current) return

      reconnectAttemptsRef.current += 1
      const attempt = reconnectAttemptsRef.current
      if (attempt <= maxAttempts) {
        const backoff = Math.min(30_000, 1000 * 2 ** attempt)
        backoffTimeoutRef.current = setTimeout(() => {
          connect({
            getUrlFn,
            onOpen,
            onMessage,
            onError,
            onClose,
            maxAttempts,
          })
        }, backoff)
      }
    }
  }

  const disconnect = () => {
    isManuallyClosedRef.current = true
    if (backoffTimeoutRef.current) {
      clearTimeout(backoffTimeoutRef.current)
      backoffTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (socketRef.current) {
      try {
        socketRef.current.close()
      } catch (e) {}
      socketRef.current = null
    }
  }

  return { connect, disconnect, socketRef }
}

export default useWebSocketManager
