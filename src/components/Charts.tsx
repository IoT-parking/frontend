import React, { useEffect, useState } from 'react';
import { Card, Select, DatePicker, Button, Space, message, Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { sensorApi, type SensorReading, type FilterParameters } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Charts: React.FC = () => {
    const [data, setData] = useState<SensorReading[]>([]);
    const [loading, setLoading] = useState(false);
    const [sensorTypes, setSensorTypes] = useState<string[]>([]);
    const [sensorInstances, setSensorInstances] = useState<string[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string | undefined>(undefined);
    const [filters, setFilters] = useState<FilterParameters>({
        pageSize: 1000,
        sortBy: 'Timestamp',
        sortDescending: false,
        startDate: dayjs().subtract(10, 'minute').toISOString(),
        endDate: dayjs().toISOString(),
    });

    useEffect(() => {
        fetchSensorTypes();
        fetchData();
    }, []);

    useEffect(() => {
        if (filters.sensorType) {
            fetchSensorInstances(filters.sensorType);
        }
    }, [filters.sensorType]);

    const fetchSensorTypes = async () => {
        try {
            const types = await sensorApi.getSensorTypes();
            setSensorTypes(types);
        } catch (error) {
            message.error('Failed to fetch sensor types');
        }
    };

    const fetchSensorInstances = async (type?: string) => {
        try {
            const instances = await sensorApi.getSensorInstances(type);
            setSensorInstances(instances);
        } catch (error) {
            message.error('Failed to fetch sensor instances');
        }
    };

    const fetchData = async (params: FilterParameters = filters) => {
        setLoading(true);
        try {
            const response = await sensorApi.getReadings(params);
            setData(response.data);
        } catch (error) {
            message.error('Failed to fetch sensor readings');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        
        if (key === 'sensorType') {
            setSelectedInstance(undefined);
            delete newFilters.sensorInstanceId;
        }
        
        setFilters(newFilters);
    };

    const handleInstanceChange = (value: string | undefined) => {
        setSelectedInstance(value);
        handleFilterChange('sensorInstanceId', value);
    };

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            setFilters({
                ...filters,
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString(),
            });
        } else {
            setFilters({
                ...filters,
                startDate: dayjs().subtract(10, 'minute').toISOString(),
                endDate: dayjs().toISOString(),
            });
        }
    };

    const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const groupedBySensor = sortedData.reduce((acc, reading) => {
        if (!acc[reading.sensorInstanceId]) {
            acc[reading.sensorInstanceId] = [];
        }
        acc[reading.sensorInstanceId].push(reading);
        return acc;
    }, {} as Record<string, SensorReading[]>);

    const timestampMap = new Map<string, any>();
    
    sortedData.forEach(reading => {
        const timeKey = dayjs(reading.timestamp).format('HH:mm:ss');
        if (!timestampMap.has(timeKey)) {
            timestampMap.set(timeKey, { timestamp: timeKey });
        }
        const entry = timestampMap.get(timeKey)!;
        entry[reading.sensorInstanceId] = reading.value;
    });

    const chartData = Array.from(timestampMap.values());

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0'];

    return (
        <div style={{ padding: '24px' }}>
            <h1>Sensor Data Visualization</h1>

            <Space style={{ marginBottom: 16 }} wrap>
                <Select
                    style={{ width: 200 }}
                    placeholder="Filter by Sensor Type"
                    allowClear
                    onChange={(value) => handleFilterChange('sensorType', value)}
                >
                    {sensorTypes.map((type) => (
                        <Option key={type} value={type}>
                            {type}
                        </Option>
                    ))}
                </Select>

                <Select
                    style={{ width: 200 }}
                    placeholder="Filter by Instance"
                    allowClear
                    value={selectedInstance}
                    onChange={handleInstanceChange}
                >
                    {sensorInstances.map((instance) => (
                        <Option key={instance} value={instance}>
                            {instance}
                        </Option>
                    ))}
                </Select>

                <RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    onChange={handleDateRangeChange}
                    presets={[
                        { label: 'Last Hour', value: [dayjs().subtract(1, 'hour'), dayjs()] },
                        { label: 'Last 24 Hours', value: [dayjs().subtract(24, 'hour'), dayjs()] },
                        { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                        { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                        { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
                    ]}
                />

                <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>
                    Apply Filters
                </Button>
            </Space>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Sensor Values Over Time" loading={loading}>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {Object.keys(groupedBySensor).map((sensorId, index) => (
                                    <Line
                                        key={sensorId}
                                        type="monotone"
                                        dataKey={sensorId}
                                        stroke={colors[index % colors.length]}
                                        name={sensorId}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Charts;
