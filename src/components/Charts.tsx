import React, { useEffect, useState } from 'react';
import { Card, Select, DatePicker, Button, Space, message, Row, Col } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const [filters, setFilters] = useState<FilterParameters>({
        pageSize: 1000,
        sortBy: 'Timestamp',
        sortDescending: false,
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
        setFilters(newFilters);
    };

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            setFilters({
                ...filters,
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString(),
            });
        } else {
            const newFilters = { ...filters };
            delete newFilters.startDate;
            delete newFilters.endDate;
            setFilters(newFilters);
        }
    };

    const chartData = data.map((reading) => ({
        timestamp: dayjs(reading.timestamp).format('HH:mm:ss'),
        value: reading.value,
        sensor: reading.sensorInstanceId,
    }));

    const groupedBySensor = data.reduce((acc, reading) => {
        if (!acc[reading.sensorInstanceId]) {
            acc[reading.sensorInstanceId] = [];
        }
        acc[reading.sensorInstanceId].push(reading);
        return acc;
    }, {} as Record<string, SensorReading[]>);

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
                    onChange={(value) => handleFilterChange('sensorInstanceId', value)}
                >
                    {sensorInstances.map((instance) => (
                        <Option key={instance} value={instance}>
                            {instance}
                        </Option>
                    ))}
                </Select>

                <RangePicker
                    showTime
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD HH:mm:ss"
                />

                <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>
                    Apply Filters
                </Button>
            </Space>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Sensor Values Over Time (Line Chart)" loading={loading}>
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
                                        dataKey="value"
                                        data={groupedBySensor[sensorId].map((r) => ({
                                            timestamp: dayjs(r.timestamp).format('HH:mm:ss'),
                                            value: r.value,
                                        }))}
                                        stroke={colors[index % colors.length]}
                                        name={sensorId}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Average Values by Sensor (Bar Chart)" loading={loading}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={Object.entries(groupedBySensor).map(([sensorId, readings]) => ({
                                    sensor: sensorId,
                                    average: readings.reduce((sum, r) => sum + r.value, 0) / readings.length,
                                    count: readings.length,
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="sensor" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="average" fill="#8884d8" name="Average Value" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Charts;
