import React, { useState, useEffect, useContext } from 'react'
import { Typography, Progress, Space, Button, Card } from 'antd'
import {
  SyncOutlined,
  ClockCircleOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { Context } from '../context/provider'

const { Text, Title } = Typography

const ForensicCodeGenerator = () => {
  const { code, setCode } = useContext(Context)

  const [timeLeft, setTimeLeft] = useState(600)

  const generateCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString()
    setCode(newCode)
    setTimeLeft(600)
  }

  useEffect(() => {
    let timer
    if (code && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Logic when code expires
      setCode(null)
    }

    return () => clearInterval(timer)
  }, [code, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
      {!code ? (
        /* INITIAL STATE: Only generates when clicked */
        <Space direction="vertical">
          <LockOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
          <Text type="secondary">
            The verification code is hidden for security.
          </Text>
          <Button
            style={{ background: '#52c41a' }}
            type="primary"
            size="large"
            onClick={generateCode}
          >
            Generate Verification Code
          </Button>
        </Space>
      ) : (
        /* ACTIVE STATE: Timer is running */
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary" strong>
            YOUR VERIFICATION CODE
          </Text>

          <Title
            level={1}
            style={{ margin: 0, letterSpacing: '8px', color: '#52c41a' }}
          >
            {code}
          </Title>

          <div style={{ maxWidth: '200px', margin: '0 auto' }}>
            <Progress
              percent={(timeLeft / 600) * 100}
              showInfo={false}
              strokeColor={timeLeft < 60 ? '#ff4d4f' : '#52c41a'}
              size="small"
            />
            <Space>
              <ClockCircleOutlined
                style={{ color: timeLeft < 60 ? '#ff4d4f' : '#8c8c8c' }}
              />
              <Text type={timeLeft < 60 ? 'danger' : 'secondary'}>
                Expires in {formatTime(timeLeft)}
              </Text>
            </Space>
          </div>

          <Button
            style={{ background: '#52c41a', color: 'white' }}
            type="link"
            icon={<SyncOutlined />}
            onClick={generateCode}
          >
            Regenerate New Code
          </Button>
        </Space>
      )}
    </Card>
  )
}

export default ForensicCodeGenerator
