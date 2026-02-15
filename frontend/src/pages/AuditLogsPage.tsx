import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { History, User, Activity, Globe, BarChart2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx'
import LazyChart from '../components/Charts/LazyChart';

const AuditLogsPage = () => {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data } = await api.get('/users/logs');
            return data;
        }
    });

    const actionData = useMemo(() => {
        if (!logs) return [];
        const counts: Record<string, number> = {};
        logs.forEach((log: any) => {
            const actionType = log.action.split(' ')[0];
            counts[actionType] = (counts[actionType] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [logs]);

    const timeData = useMemo(() => {
        if (!logs) return { dates: [], counts: [] };
        const counts: Record<string, number> = {};
        const sorted = [...logs].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        sorted.forEach((log: any) => {
            const date = format(parseISO(log.timestamp), 'MMM dd');
            counts[date] = (counts[date] || 0) + 1;
        });

        return {
            dates: Object.keys(counts),
            counts: Object.values(counts)
        };
    }, [logs]);

    const actionOption = {
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center', textStyle: { color: '#a1a1aa' } },
        series: [
            {
                name: 'Action Type',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#18181b',
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' }
                },
                data: actionData
            }
        ]
    };

    const timelineOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: timeData.dates,
            axisLine: { show: false }
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#27272a' } } },
        series: [
            {
                data: timeData.counts,
                type: 'bar',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#3b82f6' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    if (isLoading) return <div className="animate-pulse">Loading logs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 glass p-8 rounded-3xl border border-white/5">
                <div className="p-4 bg-primary/10 rounded-2xl">
                    <History className="text-primary" size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Audit Trail</h2>
                    <p className="text-gray-500">Security event logging and user action tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" />
                        Activity Volume
                    </h3>
                    <LazyChart option={timelineOption} height="250px" />
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BarChart2 size={18} className="text-purple-500" />
                        Action Distribution
                    </h3>
                    <LazyChart option={actionOption} height="250px" />
                </div>
            </div>

            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                    {logs?.map((log: any) => (
                        <div key={log.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={clsx(
                                    "p-3 rounded-xl",
                                    log.action.includes('DELETE') ? "bg-red-500/10 text-red-500" :
                                        log.action.includes('CREATE') ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="font-bold tracking-tight">{log.action}</p>
                                    <p className="text-sm text-gray-500">{log.details}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500">
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                    <User size={14} />
                                    {log.user?.name || 'System'}
                                </span>
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                    <Globe size={14} />
                                    {log.ipAddress || 'Internal'}
                                </span>
                                <span className="flex items-center gap-2 px-3">
                                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                </span>
                            </div>
                        </div>
                    ))}

                    {logs?.length === 0 && (
                        <div className="p-20 text-center text-gray-500">
                            No audit logs found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
