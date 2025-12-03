import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Menu.module.css'
import { Badge, Menu } from 'antd'
import {
  HomeFilled,
  PlusCircleFilled,
  MessageFilled,
  ProductFilled,
  HeartFilled,
  HomeOutlined,
  PlusCircleOutlined,
  MessageOutlined,
  ProductOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { Context } from '../context/provider'

const IconText = ['Home', 'Chats', 'Sell', 'My Ads', 'Favourites']

const MenuWrapper = ({
  setScrollPosition,
  scrollableDivRef,
  defaultSelectedKeys,
  isMobile,
}) => {
  const { unreadChatCount } = useContext(Context)
  const navigate = useNavigate()
  const keyIndex = parseInt(defaultSelectedKeys[0])

  const handleNavigation = (event) => {
    if (scrollableDivRef?.current) {
      setScrollPosition(scrollableDivRef.current.scrollTop)
    }

    const routes = ['/', '/chatPage', '/addProduct', '/ads', '/favourite']
    navigate(routes[parseInt(event.key) - 1])
  }

  const filledIcons = [
    HomeFilled,
    MessageFilled,
    PlusCircleFilled,
    ProductFilled,
    HeartFilled,
  ]
  const outlinedIcons = [
    HomeOutlined,
    MessageOutlined,
    PlusCircleOutlined,
    ProductOutlined,
    HeartOutlined,
  ]

  const items = Array.from({ length: 5 }).map((_, index) => {
    const isSelected = index === keyIndex - 1
    const IconComponent = isSelected ? filledIcons[index] : outlinedIcons[index]

    const divHtml = (
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60px',
        }}
      >
        <span
          style={{
            marginTop: '5px',
            color: '#389e0d',
            transform: 'scale(1.4)',
          }}
        >
          {React.createElement(IconComponent)}
        </span>
        <span
          style={{
            fontSize: isMobile ? '10px' : '15px',
            marginTop: isMobile ? '10px' : '5px',
            marginLeft: isMobile ? '0px' : '10px',
          }}
        >
          {IconText[index]}
        </span>
      </div>
    )

    return {
      key: String(index + 1),
      icon:
        index === 1 ? (
          <Badge
            dot={unreadChatCount}
            style={{
              width: isMobile ? 8 : 8,
              height: isMobile ? 8 : 8,
            }}
            offset={[0, isMobile ? 10 : 15]}
          >
            {divHtml}
          </Badge>
        ) : (
          divHtml
        ),
    }
  })

  return (
    <Menu
      onClick={handleNavigation}
      mode="horizontal"
      defaultSelectedKeys={defaultSelectedKeys}
      items={items}
      style={{
        display: 'flex',
        background: 'white',
        width: '100dvw',
        height: '60px',
        padding: '0px 10px 0px 10px',
      }}
    />
  )
}

export default MenuWrapper
