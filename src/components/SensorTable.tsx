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
    const [selectedInstance, setSelectedInstance] = useState<string | undefined>(undefined);
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
        
        // Reset sensor instance when sensor type changes
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
                    value={selectedInstance}
                    onChange={handleInstanceChange}
                    disabled={!sensorInstances.length}
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
