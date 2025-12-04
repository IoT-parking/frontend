import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Row, Col, Typography, Spin, Alert } from 'antd';
import { DollarCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { blockchainApi } from '../services/api';

const { Title } = Typography;

const BlockchainDashboard: React.FC = () => {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const data = await blockchainApi.getBalances();
      setBalances(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blockchain balances.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const totalTokens = Object.values(balances).reduce((acc, val) => acc + val, 0);

  const columns = [
    {
      title: 'Sensor ID',
      dataIndex: 'sensorId',
      key: 'sensorId',
    },
    {
      title: 'Token Balance (SENS)',
      dataIndex: 'balance',
      key: 'balance',
      render: (val: number) => val.toFixed(4),
      sorter: (a: any, b: any) => a.balance - b.balance,
    },
  ];

  const dataSource = Object.entries(balances).map(([key, value]) => ({
    key,
    sensorId: key,
    balance: value,
  }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Blockchain Rewards</Title>
        <DollarCircleOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />}

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Tokens Distributed"
              value={totalTokens}
              precision={2}
              prefix={<DollarCircleOutlined />}
              suffix="SENS"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Sensor Wallets & Balances" extra={<a onClick={fetchBalances}><ReloadOutlined /> Refresh</a>}>
        {loading && !dataSource.length ? (
          <Spin size="large" />
        ) : (
          <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 10 }} />
        )}
      </Card>
    </div>
  );
};

export default BlockchainDashboard;
