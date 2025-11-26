import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThunderboltOutlined, FireOutlined, DashboardOutlined, ExperimentOutlined } from '@ant-design/icons';
import { sensorApi } from '../services/api';
import dayjs from 'dayjs';

interface SensorStats {
    instanceId: string;
    latestValue: number;
    averageValue: number;
    unit: string;
    type: string;
    lastUpdated: string;
}

const LiveDashboard: React.FC = () => {
    const [stats, setStats] = useState<SensorStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [sensorInstances, setSensorInstances] = useState<string[]>([]);

    useEffect(() => {
        initializeDashboard();
        const interval = setInterval(updateDashboard, 1000);
        return () => clearInterval(interval);
    }, []);

    const initializeDashboard = async () => {
        try {
            const instances = await sensorApi.getSensorInstances();
            setSensorInstances(instances);
            await updateDashboard(instances);
        } catch (error) {
            message.error('Failed to initialize dashboard');
        } finally {
            setLoading(false);
        }
    };

    const updateDashboard = async (instances?: string[]) => {
        const instancesToUpdate = instances || sensorInstances;
        if (instancesToUpdate.length === 0) return;

        try {
            const statsPromises = instancesToUpdate.map(async (instanceId) => {
                const [lastReadings, avgData] = await Promise.all([
                    sensorApi.getLastReadings(instanceId, 1),
                    sensorApi.getAverage(instanceId, 100),
                ]);

                if (lastReadings.length > 0) {
                    const latest = lastReadings[0];
                    return {
                        instanceId,
                        latestValue: latest.value,
                        averageValue: avgData.average,
                        unit: latest.unit,
                        type: latest.sensorType,
                        lastUpdated: latest.timestamp,
                    };
                }
                return null;
            });

            const results = await Promise.all(statsPromises);
            setStats(results.filter((s): s is SensorStats => s !== null));
        } catch (error) {
            console.error('Failed to update dashboard:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'temperature':
                return <FireOutlined style={{ color: '#ff4d4f' }} />;
            case 'occupancy':
                return <DashboardOutlined style={{ color: '#1890ff' }} />;
            case 'carbon_monoxide':
                return <ExperimentOutlined style={{ color: '#fa541c' }} />;
            case 'energy_consumption':
                return <ThunderboltOutlined style={{ color: '#52c41a' }} />;
            default:
                return <DashboardOutlined />;
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <h1>Live Sensor Dashboard</h1>
            <p style={{ marginBottom: '24px', color: '#888' }}>
                Real-time monitoring - Updates every second
            </p>

            <Row gutter={[16, 16]}>
                {stats.map((stat) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={stat.instanceId}>
                        <Card>
                            <Statistic
                                title={stat.instanceId}
                                value={stat.latestValue}
                                precision={2}
                                prefix={getIcon(stat.type)}
                                suffix={stat.unit}
                            />
                            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                                <div>Avg (last 100): {stat.averageValue.toFixed(2)} {stat.unit}</div>
                                <div>Updated: {dayjs(stat.lastUpdated).format('HH:mm:ss')}</div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default LiveDashboard;
