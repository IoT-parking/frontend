import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, TableOutlined, BarChartOutlined, WalletOutlined } from '@ant-design/icons';
import SensorTable from './components/SensorTable';
import LiveDashboard from './components/LiveDashboard';
import Charts from './components/Charts';
import BlockchainDashboard from './components/BlockchainDashboard';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ color: 'white', fontSize: '20px', marginRight: '50px' }}>
            IoT Parking System
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['dashboard']}
            style={{ flex: 1, minWidth: 0 }}
          >
            <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
              <Link to="/">Live Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="table" icon={<TableOutlined />}>
              <Link to="/table">Sensor Data</Link>
            </Menu.Item>
            <Menu.Item key="charts" icon={<BarChartOutlined />}>
              <Link to="/charts">Visualizations</Link>
            </Menu.Item>
            <Menu.Item key="blockchain" icon={<WalletOutlined />}>
              <Link to="/blockchain">Rewards</Link>
            </Menu.Item>
          </Menu>
        </Header>

        <Content style={{ padding: '0 50px', marginTop: 16 }}>
          <Routes>
            <Route path="/" element={<LiveDashboard />} />
            <Route path="/table" element={<SensorTable />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/blockchain" element={<BlockchainDashboard />} />
          </Routes>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          IoT Parking System ©{new Date().getFullYear()} Created with ASP.NET Core & React
        </Footer>
      </Layout>
    </Router>
  );
}

export default App;

