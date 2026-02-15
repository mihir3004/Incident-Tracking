import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { socket } from '../utils/socket';
import { clsx } from 'clsx'
import {
    ShieldAlert,
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';
import LazyChart from '../components/Charts/LazyChart';

const Dashboard = () => {
    const { data: incidents, refetch } = useQuery({
        queryKey: ['incidents'],
        queryFn: async () => {
            const { data } = await api.get('/incidents');
            return data;
        }
    });

    useEffect(() => {
        const handleUpdate = () => refetch();
        socket.on('incidentUpdate', handleUpdate);

        return () => {
            socket.off('incidentUpdate', handleUpdate);
        };
    }, [refetch]);

    if (!incidents) return <div className="animate-pulse">Loading dashboard...</div>;

    const stats = [
        { label: 'Total Incidents', value: incidents.length, icon: ShieldAlert, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Open', value: incidents.filter((i: any) => i.status === 'OPEN').length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'In Progress', value: incidents.filter((i: any) => i.status === 'IN_PROGRESS').length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Resolved', value: incidents.filter((i: any) => i.status === 'RESOLVED').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    const pieData = [
        { name: 'Open', value: incidents.filter((i: any) => i.status === 'OPEN').length },
        { name: 'In Progress', value: incidents.filter((i: any) => i.status === 'IN_PROGRESS').length },
        { name: 'Resolved', value: incidents.filter((i: any) => i.status === 'RESOLVED').length },
    ];

    const categoryCounts = incidents.reduce((acc: any, i: any) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
    }, {});

    const barDataCategory = Object.keys(categoryCounts);
    const barDataValue = Object.values(categoryCounts);

    const pieOption = {
        tooltip: {
            trigger: 'item',
        },
        legend: {
            bottom: '0%',
            left: 'center',
            itemGap: 20,
            textStyle: {
                color: '#a1a1aa'
            }
        },
        series: [
            {
                name: 'Status',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#18181b',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#fff'
                    }
                },
                labelLine: {
                    show: false
                },
                data: pieData
            }
        ]
    };

    const barOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: barDataCategory,
                axisTick: {
                    alignWithLabel: true
                },
                axisLine: {
                    show: false
                }
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: 'Count',
                type: 'bar',
                barWidth: '40%',
                data: barDataValue,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: '#a855f7'
                }
            }
        ]
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx("p-3 rounded-2xl", stat.bg)}>
                                <stat.icon className={stat.color} size={24} />
                            </div>
                            <TrendingUp size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Incident Status Distribution
                        <ArrowUpRight size={16} className="text-gray-500" />
                    </h3>
                    <LazyChart option={pieOption} height="300px" />
                </div>



                <div className="glass p-8 rounded-3xl border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Most Common Categories
                        <ArrowUpRight size={16} className="text-gray-500" />
                    </h3>
                    <LazyChart option={barOption} height="300px" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
