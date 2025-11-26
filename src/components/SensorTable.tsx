import React, { useEffect, useState } from 'react';
import { Table, Select, DatePicker, Button, Space, message, Tag } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { sensorApi, type SensorReading, type FilterParameters } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SensorTable: React.FC = () => {
    const [data, setData] = useState<SensorReading[]>([]);
    const [loading, setLoading] = useState(false);
    const [sensorTypes, setSensorTypes] = useState<string[]>([]);
    const [sensorInstances, setSensorInstances] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [filters, setFilters] = useState<FilterParameters>({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'Timestamp',
        sortDescending: true,
    });

    useEffect(() => {
        fetchSensorTypes();
        fetchData();
    }, []);

    useEffect(() => {
        if (filters.sensorType) {
            fetchSensorInstances(filters.sensorType);
        } else {
            fetchSensorInstances();
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
            setPagination({
                current: response.pageNumber,
                pageSize: response.pageSize,
                total: response.totalRecords,
            });
        } catch (error) {
            message.error('Failed to fetch sensor readings');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination: TablePaginationConfig, _filters: any, sorter: any) => {
        const newFilters = {
            ...filters,
            pageNumber: newPagination.current || 1,
            pageSize: newPagination.pageSize || 10,
        };

        if (sorter.field) {
            newFilters.sortBy = sorter.field === 'timestamp' ? 'Timestamp' : 'Value';
            newFilters.sortDescending = sorter.order === 'descend';
        }

        setFilters(newFilters);
        fetchData(newFilters);
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value, pageNumber: 1 };
        setFilters(newFilters);
    };

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            setFilters({
                ...filters,
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString(),
                pageNumber: 1,
            });
        } else {
            const newFilters = { ...filters };
            delete newFilters.startDate;
            delete newFilters.endDate;
            setFilters(newFilters);
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const blob = format === 'csv'
                ? await sensorApi.exportToCsv(filters)
                : await sensorApi.exportToJson(filters);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sensor_readings_${dayjs().format('YYYYMMDD_HHmmss')}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            message.success(`Exported to ${format.toUpperCase()}`);
        } catch (error) {
            message.error(`Failed to export to ${format.toUpperCase()}`);
        }
    };

    const getSensorTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            occupancy: 'blue',
            carbon_monoxide: 'red',
            temperature: 'orange',
            energy_consumption: 'green',
        };
        return colors[type] || 'default';
    };

    const columns: ColumnsType<SensorReading> = [
        {
            title: 'Sensor Type',
            dataIndex: 'sensorType',
            key: 'sensorType',
            render: (type: string) => <Tag color={getSensorTypeColor(type)}>{type}</Tag>,
        },
        {
            title: 'Sensor Instance',
            dataIndex: 'sensorInstanceId',
            key: 'sensorInstanceId',
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            sorter: true,
            render: (value: number) => value.toFixed(2),
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            sorter: true,
            render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (location: string | undefined) => location || '-',
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h1>Sensor Readings</h1>

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
                    disabled={!sensorInstances.length}
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

                <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchData()}>
                    Refresh
                </Button>

                <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
                    Export CSV
                </Button>

                <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')}>
                    Export JSON
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />
        </div>
    );
};

export default SensorTable;
