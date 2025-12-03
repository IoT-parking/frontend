import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Badge, Space } from 'antd';
import { ThunderboltOutlined, FireOutlined, DashboardOutlined, ExperimentOutlined, WifiOutlined } from '@ant-design/icons';
import { sensorApi } from '../services/api';
import { signalRService, type SensorReading } from '../services/signalRService';
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
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        initializeDashboard();
        
        return () => {
            signalRService.stop();
        };
    }, []);

    const initializeDashboard = async () => {
        try {
            const instances = await sensorApi.getSensorInstances();
            await loadInitialData(instances);
            
            await signalRService.start();
            setConnected(true);
            
            const unsubscribe = signalRService.onSensorReading(handleSensorReading);
            
            return () => {
                unsubscribe();
            };
        } catch (error) {
            message.error('Failed to initialize dashboard');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async (instances: string[]) => {
        if (instances.length === 0) return;

        try {
            const statsPromises = instances.map(async (instanceId) => {
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
            console.error('Failed to load initial data:', error);
        }
    };

    const handleSensorReading = async (reading: SensorReading) => {
        setStats(prevStats => {
            const existingIndex = prevStats.findIndex(
                s => s.instanceId === reading.sensorInstanceId
            );

            if (existingIndex >= 0) {
                const updated = [...prevStats];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    latestValue: reading.value,
                    lastUpdated: reading.timestamp,
                };
                return updated;
            } else {
                fetchAverageForNewSensor(reading.sensorInstanceId);
                return [
                    ...prevStats,
                    {
                        instanceId: reading.sensorInstanceId,
                        latestValue: reading.value,
                        averageValue: reading.value,
                        unit: reading.unit,
                        type: reading.sensorType,
                        lastUpdated: reading.timestamp,
                    }
                ];
            }
        });
    };

    const fetchAverageForNewSensor = async (instanceId: string) => {
        try {
            const avgData = await sensorApi.getAverage(instanceId, 100);
            setStats(prevStats => 
                prevStats.map(s => 
                    s.instanceId === instanceId 
                        ? { ...s, averageValue: avgData.average }
                        : s
                )
            );
        } catch (error) {
            console.error('Failed to fetch average for new sensor:', error);
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
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Live Sensor Dashboard</h1>
                    </div>
                    <Badge 
                        status={connected ? 'success' : 'error'} 
                        text={
                            <Space>
                                <WifiOutlined />
                                {connected ? 'Connected' : 'Disconnected'}
                            </Space>
                        }
                    />
                </div>

                <Row gutter={[16, 16]}>
                    {stats.map((stat) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={stat.instanceId}>
                            <Card>
                                <Statistic
                                    title={stat.instanceId}
                                    value={stat.latestValue}
                                    precision={stat.unit === 'boolean' ? 0 : 2}
                                    prefix={getIcon(stat.type)}
                                    suffix={stat.unit === 'boolean' ? '' : stat.unit}
                                />
                                <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                                    <div>Avg (last 100): {stat.averageValue.toFixed(2)} {stat.unit === 'boolean' ? '' : stat.unit}</div>
                                    <div>Updated: {dayjs(stat.lastUpdated).format('HH:mm:ss')}</div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Space>
        </div>
    );
};

export default LiveDashboard;
