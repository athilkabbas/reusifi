'use client'
import { signInWithRedirect } from '@aws-amplify/auth'
import {
  Layout,
  Row,
  Col,
  Button,
  Typography,
  Card,
  Space,
  Tag,
  Grid,
  Image,
} from 'antd'
import styles from './landingPage.module.css'
import {
  PoundSterling,
  ShieldCheck,
  RecycleIcon as Recycling,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Camera,
  MessageCircle,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../assets/reusifi_favicon.png'
import electronics from '../assets/electronics.png'
import furniture from '../assets/furniture.png'
import fashion from '../assets/fashion.png'
import vehicles from '../assets/vehicles.png'

const { Header, Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography
const { Meta } = Card
const { useBreakpoint } = Grid

const ReusifiLanding = () => {
  const navigate = useNavigate()

  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  const screens = useBreakpoint()

  const showMobileMenu = () => {
    setMobileMenuVisible(true)
  }

  const hideMobileMenu = () => {
    setMobileMenuVisible(false)
  }

  const menuItems = [
    { key: 'how-it-works', label: 'How it Works' },
    { key: 'features', label: 'Features' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ]

  return (
    <Layout
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#F9FAFB',
      }}
    >
      {/* Header */}
      <Header
        style={{
          background: '#fff',
          padding: screens.md ? '0 50px' : '0 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Row justify="space-between" align="middle" style={{ height: '64px' }}>
          <Col>
            <Space align="center">
              {/* <Recycling style={{ fontSize: '32px', color: '#52c41a' }} /> */}
              <Image src={logo} width={64} style={{ height: '60px' }} />
              <Title level={3} style={{ margin: 0, color: '#262626' }}>
                Reusifi
              </Title>
            </Space>
          </Col>

          {screens.md ? (
            <Col>
              <Row gutter={32} align="middle">
                {/* <Col>
                  <Menu
                    mode="horizontal"
                    items={menuItems}
                    style={{ border: "none" }}
                  />
                </Col> */}
                <Col>
                  <Space>
                    {/* <Button type="default">Sign In</Button> */}
                    <Button
                      onClick={async () => {
                        try {
                          signInWithRedirect()
                        } catch (err) {
                          navigate('/')
                        }
                      }}
                      type="primary"
                      style={{ backgroundColor: '#52c41a' }}
                    >
                      Get Started
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Col>
          ) : (
            <Col>
              <Space>
                <Button
                  onClick={async () => {
                    try {
                      signInWithRedirect()
                    } catch (err) {
                      navigate('/')
                    }
                  }}
                  type="primary"
                  size="small"
                  style={{ backgroundColor: '#52c41a' }}
                >
                  Get Started
                </Button>
                {/* <Button type="text" icon={<Users />} onClick={showMobileMenu} /> */}
              </Space>
            </Col>
          )}
        </Row>

        {/* <Drawer
          title="Menu"
          placement="right"
          onClose={hideMobileMenu}
          open={mobileMenuVisible}
          width={280}
        >
          <Menu mode="vertical" items={menuItems} onClick={hideMobileMenu} />
          <Divider />
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button type="default" block>
              Sign In
            </Button>
            <Button type="primary" block style={{ backgroundColor: "#52c41a" }}>
              Get Started
            </Button>
          </Space>
        </Drawer> */}
      </Header>

      <Content
        style={{
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {/* Hero Section */}
        <div className="hero-section">
          <div style={{ padding: screens.md ? '80px 50px' : '40px 20px' }}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={14}>
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: '100%' }}
                >
                  <Tag
                    color="green"
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    🌱 Sustainable Shopping
                  </Tag>

                  <Title
                    level={1}
                    className="hero-title"
                    style={{
                      fontSize: screens.md ? '3.5rem' : '2rem',
                      lineHeight: 1.2,
                      marginBottom: 0,
                    }}
                  >
                    Buy & Sell Used Items with{' '}
                    <span style={{ color: '#52c41a' }}>Confidence</span>
                  </Title>

                  <Paragraph
                    className="hero-subtitle"
                    style={{
                      fontSize: screens.md ? '1.25rem' : '1rem',
                      color: '#595959',
                      maxWidth: '600px',
                    }}
                  >
                    Join thousands of people giving items a second life. Find
                    great deals, declutter your space, and help the environment
                    - all in one place.
                  </Paragraph>

                  <Space
                    direction={screens.sm ? 'horizontal' : 'vertical'}
                    size="middle"
                    style={{ width: screens.sm ? 'auto' : '100%' }}
                  >
                    <Button
                      onClick={async () => {
                        try {
                          signInWithRedirect()
                        } catch (err) {
                          navigate('/')
                        }
                      }}
                      type="primary"
                      size="large"
                      style={{ backgroundColor: '#52c41a', minWidth: '160px' }}
                      icon={<ArrowRight />}
                      iconPosition="end"
                    >
                      Start Selling
                    </Button>
                    {/* <Button size="large" style={{ minWidth: "160px" }}>
                      Browse Items
                    </Button> */}
                  </Space>

                  <Row gutter={[24, 8]} style={{ marginTop: '20px' }}>
                    <Col xs={24} sm={8}>
                      <Space>
                        <CheckCircle style={{ color: '#52c41a' }} />
                        <Text type="secondary">Free to list</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Space>
                        <CheckCircle style={{ color: '#52c41a' }} />
                        <Text type="secondary">Secure payments</Text>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Col>

              {/* <Col xs={24} lg={10}>
                <div style={{ textAlign: "center" }}>
                  <Image
                    src="/images/hero-marketplace.png"
                    alt="Reusifi marketplace interface"
                    style={{
                      borderRadius: "12px",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                    preview={false}
                  />
                </div>
              </Col> */}
            </Row>
          </div>
        </div>

        {/* Stats Section */}
        {/* <div
          className="stats-section"
          style={{ padding: screens.md ? "80px 50px" : "40px 20px" }}
        >
          <Row gutter={[32, 32]} justify="center">
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Active Users"
                  value={50}
                  suffix="K+"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: screens.md ? "2.5rem" : "1.8rem",
                  }}
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Items Sold"
                  value={200}
                  suffix="K+"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: screens.md ? "2.5rem" : "1.8rem",
                  }}
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Total Savings"
                  value={2}
                  suffix="M+"
                  prefix="$"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: screens.md ? "2.5rem" : "1.8rem",
                  }}
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Satisfaction Rate"
                  value={98}
                  suffix="%"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: screens.md ? "2.5rem" : "1.8rem",
                  }}
                />
              </div>
            </Col>
          </Row>
        </div> */}

        {/* How It Works Section */}
        <div
          className="features-section"
          style={{ padding: screens.md ? '80px 50px' : '40px 20px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title
              level={2}
              style={{ fontSize: screens.md ? '2.5rem' : '2rem' }}
            >
              How Reusifi Works
            </Title>
            <Paragraph
              style={{
                fontSize: '1.1rem',
                color: '#595959',
                maxWidth: '800px',
                margin: '0 auto',
              }}
            >
              Simple steps to start buying and selling used items in your
              community
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={8}>
              <Card
                style={{
                  textAlign: 'center',
                  height: '100%',
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                styles={{ body: { padding: '32px 24px' } }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <Camera style={{ fontSize: '32px', color: '#52c41a' }} />
                </div>
                <Title level={4}>1. List Your Item</Title>
                <Paragraph style={{ color: '#595959' }}>
                  Take photos, write a description, and set your price. Listing
                  is completely free!
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={{
                  textAlign: 'center',
                  height: '100%',
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                styles={{ body: { padding: '32px 24px' } }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <MessageCircle
                    style={{ fontSize: '32px', color: '#52c41a' }}
                  />
                </div>
                <Title level={4}>2. Connect with Buyers</Title>
                <Paragraph style={{ color: '#595959' }}>
                  Chat with interested buyers, answer questions, and arrange
                  pickup or delivery.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={{
                  textAlign: 'center',
                  height: '100%',
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                styles={{ body: { padding: '32px 24px' } }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <PoundSterling
                    style={{ fontSize: '32px', color: '#52c41a' }}
                  />
                </div>
                <Title level={4}>3. Get Paid</Title>
                <Paragraph style={{ color: '#595959' }}>
                  Complete the sale with secure payment options and earn money
                  from items you no longer need.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Features Section */}
        {/* <div style={{ padding: screens.md ? '80px 50px' : '40px 20px' }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={14}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                <div>
                  <Title
                    level={2}
                    style={{ fontSize: screens.md ? '2.5rem' : '2rem' }}
                  >
                    Why Choose Reusifi?
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: '1.1rem',
                      color: '#595959',
                      maxWidth: '600px',
                    }}
                  >
                    We've built the most trusted platform for buying and selling
                    used items locally.
                  </Paragraph>
                </div>

                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: '100%' }}
                >
                  <Row gutter={[16, 16]} align="top">
                    <Col flex="none">
                      <ShieldCheck
                        style={{
                          fontSize: '24px',
                          color: '#52c41a',
                          marginTop: '4px',
                        }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Title level={4} style={{ marginBottom: '8px' }}>
                        Secure & Safe
                      </Title>
                      <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
                        Verified profiles, secure messaging, and buyer
                        protection for peace of mind.
                      </Paragraph>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} align="top">
                    <Col flex="none">
                      <Smartphone
                        style={{
                          fontSize: '24px',
                          color: '#52c41a',
                          marginTop: '4px',
                        }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Title level={4} style={{ marginBottom: '8px' }}>
                        Mobile-First
                      </Title>
                      <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
                        Easy-to-use mobile app for listing, browsing, and
                        managing your sales on the go.
                      </Paragraph>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} align="top">
                    <Col flex="none">
                      <Users
                        style={{
                          fontSize: '24px',
                          color: '#52c41a',
                          marginTop: '4px',
                        }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Title level={4} style={{ marginBottom: '8px' }}>
                        Local Community
                      </Title>
                      <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
                        Connect with buyers and sellers in your neighborhood for
                        easy pickup and delivery.
                      </Paragraph>
                    </Col>
                  </Row>
                </Space>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <div style={{ textAlign: "center" }}>
                <Image
                  src="/images/mobile-app-features.png"
                  alt="Reusifi mobile app features"
                  style={{
                    borderRadius: "12px",
                    maxWidth: "100%",
                    height: "auto",
                  }}
                  preview={false}
                />
              </div>
            </Col>
          </Row>
        </div> */}

        {/* Categories Section */}
        <div
          className="features-section"
          style={{ padding: screens.md ? '80px 50px' : '40px 20px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title
              level={2}
              style={{ fontSize: screens.md ? '2.5rem' : '2rem' }}
            >
              Popular Categories
            </Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#595959' }}>
              Find great deals across all categories
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                className="category-card"
                cover={
                  <Image
                    src={electronics}
                    alt="Electronics"
                    style={{ height: '200px', objectFit: 'cover' }}
                    preview={false}
                  />
                }
              >
                <Meta
                  title="Electronics"
                  description="Phones, laptops, gaming consoles & more"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                className="category-card"
                cover={
                  <Image
                    src={furniture}
                    alt="Furniture"
                    style={{ height: '200px', objectFit: 'cover' }}
                    preview={false}
                  />
                }
              >
                <Meta
                  title="Furniture"
                  description="Sofas, tables, decor & home essentials"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                className="category-card"
                cover={
                  <Image
                    src={fashion}
                    alt="Fashion"
                    style={{ height: '200px', objectFit: 'cover' }}
                    preview={false}
                  />
                }
              >
                <Meta
                  title="Fashion"
                  description="Clothes, shoes, accessories & jewelry"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  boxShadow:
                    '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
                className="category-card"
                cover={
                  <Image
                    src={vehicles}
                    alt="Vehicles"
                    style={{ height: '200px', objectFit: 'cover' }}
                    preview={false}
                  />
                }
              >
                <Meta
                  title="Vehicles"
                  description="Cars, Motorcycles & Scooters"
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Testimonials Section */}
        {/* <div style={{ padding: screens.md ? "80px 50px" : "40px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <Title
              level={2}
              style={{ fontSize: screens.md ? "2.5rem" : "2rem" }}
            >
              What Our Users Say
            </Title>
            <Paragraph style={{ fontSize: "1.1rem", color: "#595959" }}>
              Join thousands of satisfied buyers and sellers
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card style={{ height: "100%" }}>
                <div style={{ marginBottom: "16px" }}>
                  <Rate
                    disabled
                    defaultValue={5}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <Paragraph style={{ fontSize: "16px", marginBottom: "16px" }}>
                  "I've sold over $2,000 worth of items I no longer needed. The
                  platform is so easy to use and the buyers are genuine!"
                </Paragraph>
                <Text strong>- Sarah M.</Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ height: "100%" }}>
                <div style={{ marginBottom: "16px" }}>
                  <Rate
                    disabled
                    defaultValue={5}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <Paragraph style={{ fontSize: "16px", marginBottom: "16px" }}>
                  "Found amazing deals on furniture for my new apartment. Saved
                  hundreds compared to buying new!"
                </Paragraph>
                <Text strong>- Mike R.</Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ height: "100%" }}>
                <div style={{ marginBottom: "16px" }}>
                  <Rate
                    disabled
                    defaultValue={5}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <Paragraph style={{ fontSize: "16px", marginBottom: "16px" }}>
                  "Great way to declutter and make some extra cash. The
                  messaging system makes communication so smooth."
                </Paragraph>
                <Text strong>- Jessica L.</Text>
              </Card>
            </Col>
          </Row>
        </div> */}

        {/* CTA Section */}
        <div
          className="cta-section"
          style={{ padding: screens.md ? '80px 50px' : '40px 20px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Title
                level={2}
                style={{
                  color: 'white',
                  fontSize: screens.md ? '2.5rem' : '2rem',
                }}
              >
                Ready to Start Selling?
              </Title>
              <Paragraph
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '1.1rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Join Reusifi today and turn your unused items into cash while
                helping the environment.
              </Paragraph>
              <Space
                direction={screens.sm ? 'horizontal' : 'vertical'}
                size="middle"
                style={{ width: screens.sm ? 'auto' : '100%' }}
              >
                <Button
                  onClick={async () => {
                    try {
                      signInWithRedirect()
                    } catch (err) {
                      navigate('/')
                    }
                  }}
                  size="large"
                  style={{
                    backgroundColor: 'white',
                    color: '#52c41a',
                    border: 'none',
                    minWidth: '180px',
                  }}
                >
                  Get Started for Free
                </Button>
                {/* <Button size="large" ghost style={{ minWidth: "180px" }}>
                  Download App
                </Button> */}
              </Space>
            </Space>
          </div>
        </div>

        {/* Newsletter Section */}
        {/* <div
          style={{
            padding: screens.md ? "80px 50px" : "40px 20px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Title
                  level={2}
                  style={{ fontSize: screens.md ? "2.5rem" : "2rem" }}
                >
                  Stay Updated
                </Title>
                <Paragraph style={{ fontSize: "1.1rem", color: "#595959" }}>
                  Get notified about new features, tips for selling, and the
                  best deals in your area.
                </Paragraph>
              </div>

              <Form
                layout={screens.sm ? "inline" : "vertical"}
                style={{ justifyContent: "center" }}
              >
                <Form.Item
                  style={{ marginBottom: screens.sm ? 0 : "16px", flex: 1 }}
                >
                  <Input
                    placeholder="Enter your email"
                    size="large"
                    style={{ width: screens.sm ? "300px" : "100%" }}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      backgroundColor: "#52c41a",
                      width: screens.sm ? "auto" : "100%",
                    }}
                  >
                    Subscribe
                  </Button>
                </Form.Item>
              </Form>

              <Text type="secondary" style={{ fontSize: "12px" }}>
                No spam, unsubscribe at any time.{" "}
                <a href="/privacy" style={{ textDecoration: "underline" }}>
                  Privacy Policy
                </a>
              </Text>
            </Space>
          </div>
        </div> */}
      </Content>

      {/* Footer */}
      <Footer
        style={{
          backgroundColor: '#fafafa',
          borderTop: '1px solid #f0f0f0',
          padding: '10px',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={24}>
            <Space align="center">
              {/* <Recycling style={{ fontSize: '24px', color: '#52c41a' }} /> */}
              <Image src={logo} width={64} />
              <Text style={{ whiteSpace: 'nowrap' }} strong>
                Reusifi
              </Text>
              <Text type="secondary">© 2025 Reusifi. All rights reserved.</Text>
            </Space>
          </Col>
          {/* <Col xs={24} sm={12}>
            <div style={{ textAlign: screens.sm ? "right" : "left" }}>
              <Space wrap>
                <a href="/terms" style={{ fontSize: "12px" }}>
                  Terms of Service
                </a>
                <a href="/privacy" style={{ fontSize: "12px" }}>
                  Privacy Policy
                </a>
                <a href="/support" style={{ fontSize: "12px" }}>
                  Support
                </a>
              </Space>
            </div>
          </Col> */}
        </Row>
      </Footer>
    </Layout>
  )
}

export default ReusifiLanding
