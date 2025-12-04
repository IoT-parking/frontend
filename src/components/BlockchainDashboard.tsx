import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Row, Col, Typography, Tag, Alert, Button, Tooltip } from 'antd';
import { DollarCircleOutlined, ReloadOutlined, WalletOutlined, PartitionOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { sensorApi, type SensorStatus } from '../services/api';

const { Title, Text } = Typography;

const BlockchainDashboard: React.FC = () => {
  const [data, setData] = useState<SensorStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    // Nie ustawiamy loading na true przy odświeżaniu w tle, żeby tabela nie migała
    if (data.length === 0) setLoading(true);
    
    try {
      // Pobieramy dane z Twojego nowego endpointu w C#
      const statuses = await sensorApi.getSensorRewardsStatus();
      setData(statuses);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blockchain status from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Automatyczne odświeżanie co 5 sekund
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Obliczenia statystyk
  const totalSystemTokens = data.reduce((acc, curr) => acc + curr.tokens, 0);
  const richSensors = data.filter(s => s.tokens > 0).length;

  const columns = [
    {
      title: 'Sensor ID',
      dataIndex: 'sensorId',
      key: 'sensorId',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Wallet Address (Generated)',
      dataIndex: 'wallet',
      key: 'wallet',
      render: (wallet: string) => (
        <Tooltip title={wallet}>
            <Tag icon={<WalletOutlined />} color="geekblue" style={{ fontFamily: 'monospace', cursor: 'pointer' }}>
                {wallet.substring(0, 6)}...{wallet.substring(38)}
            </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Token Balance',
      dataIndex: 'tokens',
      key: 'tokens',
      render: (tokens: number) => (
        <Tag color={tokens > 0 ? "success" : "default"} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {tokens.toFixed(4)} SRT
        </Tag>
      ),
      sorter: (a: SensorStatus, b: SensorStatus) => a.tokens - b.tokens,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Blockchain Rewards</Title>
          <Text type="secondary">Incentivization system for IoT sensors (ERC-20)</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ marginRight: 10, fontSize: '12px' }}>
                Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
            <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
                loading={loading && data.length === 0}
            >
                Refresh
            </Button>
        </div>
      </div>

      {error && <Alert message="Connection Error" description={error} type="error" showIcon style={{ marginBottom: '24px' }} />}

      {/* Karty ze statystykami */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Statistic
              title="Total Tokens Distributed"
              value={totalSystemTokens}
              precision={4}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarCircleOutlined />}
              suffix="SRT"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Active Wallets"
              value={data.length}
              prefix={<PartitionOutlined style={{ color: '#1890ff' }} />}
              suffix={`/ ${richSensors} earning`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
             <Statistic
              title="Network Status"
              value="Online"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix={<span style={{fontSize: '14px', color: '#999'}}>(Anvil Local)</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Główna tabela */}
      <Card 
        title={<><WalletOutlined /> Sensor Wallets Ledger</>}
        style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      >
        <Table 
            dataSource={data} 
            columns={columns} 
            rowKey="sensorId"
            loading={loading && data.length === 0}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No sensors detected yet. Waiting for MQTT data...' }}
        />
      </Card>
    </div>
  );
};

export default BlockchainDashboard;