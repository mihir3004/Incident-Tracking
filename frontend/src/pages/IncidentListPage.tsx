import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomSelect from '../components/CustomSelect';
import api from '../api/client';
import {
    Filter,
    Search,
    MoreVertical,
    User,
    Calendar,
    ShieldAlert,
    BarChart3,
    FileText
} from 'lucide-react';
import LazyChart from '../components/Charts/LazyChart';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const PRIORITY_COLORS = {
    LOW: 'text-green-400 bg-green-400/10 border-green-400/20',
    MEDIUM: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    HIGH: 'text-red-400 bg-red-400/10 border-red-400/20'
};

const IncidentListPage = () => {
    const [filter, setFilter] = useState({ status: '', category: '', search: '' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [assignee, setAssignee] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [assignmentModal, setAssignmentModal] = useState<{ isOpen: boolean, incidentId: string | null }>({ isOpen: false, incidentId: null });
    const [modal, setModal] = useState<{ isOpen: boolean, title: string, message: string }>({ isOpen: false, title: '', message: '' });
    const queryClient = useQueryClient();


    const { data: assignees } = useQuery({
        queryKey: ['assignees'],
        queryFn: async () => {
            const { data } = await api.get('/users/assignees');
            return data;
        },
        enabled: true
    });

    const { data: analyticsData } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const { data } = await api.get('/incidents/analytics');
            return data;
        }
    });

    const bulkMutation = useMutation({
        mutationFn: async ({ action, payload }: { action: 'RESOLVE' | 'ASSIGN', payload?: any }) => {
            await api.post('/incidents/bulk', { ids: selectedIds, action, payload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            setSelectedIds([]);
            setAssignee('');
            setModal({ isOpen: true, title: 'Success', message: 'Bulk action completed successfully' });
        },
        onError: (error: any) => {
            setModal({ isOpen: true, title: 'Error', message: error.response?.data?.message || 'Bulk action failed' });
        }
    });

    const { data: incidents, isLoading } = useQuery({
        queryKey: ['incidents'],
        queryFn: async () => {
            const { data } = await api.get('/incidents');
            return data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            await api.patch(`/incidents/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        },
        onError: (error: any) => {
            console.error('Update failed:', error);
            setModal({
                isOpen: true,
                title: 'Update Failed',
                message: error.response?.data?.message || error.message
            });
        }
    });

    const filteredIncidents = incidents?.filter((i: any) => {
        return (
            (filter.status ? i.status === filter.status : true) &&
            (filter.category ? i.category === filter.category : true) &&
            (filter.search ? i.title.toLowerCase().includes(filter.search.toLowerCase()) : true)
        );
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && filteredIncidents) {
            setSelectedIds(filteredIncidents.map((i: any) => i._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const [bulkConfirmModal, setBulkConfirmModal] = useState<{ isOpen: boolean, type: 'RESOLVE' | 'ASSIGN', payload?: any }>({ isOpen: false, type: 'RESOLVE' });

    const handleBulkResolve = () => {
        setBulkConfirmModal({ isOpen: true, type: 'RESOLVE' });
    };

    const handleBulkAssign = () => {
        if (!assignee) return alert('Please select an admin to assign');
        setBulkConfirmModal({ isOpen: true, type: 'ASSIGN', payload: { assignedTo: assignee } });
    };

    const confirmBulkAction = () => {
        if (bulkConfirmModal.type === 'RESOLVE') {
            bulkMutation.mutate({ action: 'RESOLVE' });
        } else if (bulkConfirmModal.type === 'ASSIGN') {
            bulkMutation.mutate({ action: 'ASSIGN', payload: bulkConfirmModal.payload });
        }
        setBulkConfirmModal({ ...bulkConfirmModal, isOpen: false });
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created At'];
        const rows = filteredIncidents.map((i: any) => [
            i._id, i.title, i.category, i.priority, i.status, new Date(i.createdAt).toISOString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "incidents_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const priorityData = analyticsData?.priorityStats.map((s: any) => ({ name: s._id, value: s.count })) || [];
    const trendDataMock = React.useMemo(() => {
        if (!incidents) return { dates: [], counts: [] };
        const counts: Record<string, number> = {};
        const sorted = [...incidents].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        sorted.forEach((i: any) => {
            const date = format(parseISO(i.createdAt), 'MMM dd');
            counts[date] = (counts[date] || 0) + 1;
        });
        return { dates: Object.keys(counts), counts: Object.values(counts) };
    }, [incidents]);

    const priorityOption = {
        tooltip: { trigger: 'item' },
        series: [
            {
                name: 'Priority',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 5, borderColor: '#09090b', borderWidth: 2 },
                label: { show: false },
                data: priorityData.length ? priorityData.map((item: any) => ({
                    ...item,
                    itemStyle: { color: item.name === 'HIGH' ? '#ef4444' : item.name === 'MEDIUM' ? '#3b82f6' : '#10b981' }
                })) : []
            }
        ]
    };

    const trendOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: trendDataMock.dates, boundaryGap: false, axisLine: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#27272a' } } },
        series: [{
            data: trendDataMock.counts,
            type: 'line',
            smooth: true,
            symbol: 'none',
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: 'rgba(168, 85, 247, 0.4)' }, { offset: 1, color: 'rgba(168, 85, 247, 0)' }]
                }
            },
            lineStyle: { width: 3, color: '#a855f7' }
        }]
    };

    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    React.useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    React.useEffect(() => {
        const socket = (window as any).socket;
        if (!socket || !user) return;

        const handleUpdate = (data: any) => {
            console.log('Incident update received:', data);
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        };

        socket.on('incidentUpdate', handleUpdate);

        return () => {
            socket.off('incidentUpdate', handleUpdate);
        };
    }, [user, queryClient]);

    const handleMenuClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    const handleSingleAssign = (incidentId: string) => {
        setAssignmentModal({ isOpen: true, incidentId });
        setActiveMenu(null);
    };

    const confirmAssignment = () => {
        if (!assignee || !assignmentModal.incidentId) return;

        api.patch(`/incidents/${assignmentModal.incidentId}`, { assignedTo: assignee, status: 'IN_PROGRESS' })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['incidents'] });
                setAssignmentModal({ isOpen: false, incidentId: null });
                setAssignee('');
                setModal({ isOpen: true, title: 'Success', message: 'Incident assigned successfully' });
            })
            .catch(err => {
                setModal({ isOpen: true, title: 'Error', message: err.response?.data?.message || 'Assignment failed' });
            });
    };

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, incidentId: string | null }>({ isOpen: false, incidentId: null });


    const handleDelete = (id: string) => {
        setDeleteModal({ isOpen: true, incidentId: id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.incidentId) return;

        try {
            await api.delete(`/incidents/${deleteModal.incidentId}`);
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            setDeleteModal({ isOpen: false, incidentId: null });
            setModal({ isOpen: true, title: 'Success', message: 'Incident deleted successfully' });
        } catch (err: any) {
            setModal({ isOpen: true, title: 'Error', message: err.response?.data?.message || 'Delete failed' });
        }
    };

    if (isLoading) return <div className="text-zinc-500 text-sm animate-pulse">Loading incidents...</div>;




    return (
        <div className="space-y-6">
            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
            >
                <div className="flex items-center gap-4 text-zinc-200">
                    <ShieldAlert size={24} className="shrink-0 text-primary" />
                    <p>{modal.message}</p>
                </div>
            </Modal>

            <Modal
                isOpen={assignmentModal.isOpen}
                onClose={() => setAssignmentModal({ isOpen: false, incidentId: null })}
                title="Assign Incident"
            >
                <div className="space-y-4">
                    <CustomSelect
                        label="Assign To"
                        value={assignee}
                        onChange={(val) => setAssignee(val)}
                        options={assignees?.map((a: any) => ({ label: a.name, value: a._id })) || []}
                        placeholder="Select Assignee..."
                        className="w-full"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setAssignmentModal({ isOpen: false, incidentId: null })}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmAssignment}
                            disabled={!assignee}
                            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Assign Agent
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, incidentId: null })}
                title="Confirm Deletion"
            >
                <div>
                    <div className="flex items-center gap-4 text-zinc-200 mb-6">
                        <ShieldAlert size={24} className="shrink-0 text-red-500" />
                        <p>Are you sure you want to permanently delete this incident? This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, incidentId: null })}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md transition-colors"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </div>
            </Modal>

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-center items-center">
                        <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Incidents</h3>
                        <p className="text-3xl font-bold text-white">{analyticsData?.totalIncidents || 0}</p>
                    </div>
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-center items-center">
                        <h3 className="text-zinc-400 text-sm font-medium mb-1">Open Incidents</h3>
                        <p className="text-3xl font-bold text-red-400">{analyticsData?.openIncidents || 0}</p>
                    </div>
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-center items-center">
                        <h3 className="text-zinc-400 text-sm font-medium mb-1">Resolved</h3>
                        <p className="text-3xl font-bold text-green-400">{analyticsData?.resolvedIncidents || 0}</p>
                    </div>
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-center items-center">
                        <h3 className="text-zinc-400 text-sm font-medium mb-1">Avg Resolution</h3>
                        <p className="text-3xl font-bold text-blue-400">{analyticsData?.avgResolutionTime || '-'}</p>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden">
                        <h3 className="font-semibold text-zinc-100 mb-4">Incident Trend</h3>
                        <LazyChart option={trendOption} height="200px" />
                    </div>
                    <div className="bg-[#09090b] p-6 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden">
                        <h3 className="font-semibold text-zinc-100 mb-4">Priority Breakdown</h3>
                        <div className="flex items-center justify-center">
                            <LazyChart option={priorityOption} height="200px" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#09090b] p-4 rounded-xl border border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2.5 pl-10 pr-4 outline-none focus:border-zinc-600 transition-all text-sm text-zinc-200"
                        />
                    </div>
                    <CustomSelect
                        value={filter.status}
                        onChange={(val) => setFilter({ ...filter, status: val })}
                        options={['All Status', ...STATUS_OPTIONS].map(s => ({ label: s === 'All Status' ? 'All Status' : s, value: s === 'All Status' ? '' : s }))}
                        className="min-w-[160px]"
                    />
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-sm font-medium"
                    >
                        <BarChart3 size={16} />
                        Export CSV
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 px-2">
                    <Filter size={14} />
                    <span>{filteredIncidents?.length} results</span>
                </div>
            </div>

            {isAdmin && selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                        selected
                    </div>
                    <div className="flex items-center gap-3">
                        <CustomSelect
                            value={assignee}
                            onChange={(val) => setAssignee(val)}
                            options={assignees?.map((a: any) => ({ label: a.name, value: a._id })) || []}
                            placeholder="Assign Selected..."
                            className="min-w-[180px]"
                        />
                        <button
                            onClick={handleBulkAssign}
                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md transition-colors"
                        >
                            Assign
                        </button>
                        <div className="h-4 w-[1px] bg-zinc-700 mx-2"></div>
                        <button
                            onClick={handleBulkResolve}
                            className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Mark Resolved
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-xs text-zinc-500 hover:text-white px-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={bulkConfirmModal.isOpen}
                onClose={() => setBulkConfirmModal({ ...bulkConfirmModal, isOpen: false })}
                title={`Confirm Bulk ${bulkConfirmModal.type === 'RESOLVE' ? 'Resolution' : 'Assignment'}`}
                footer={
                    <>
                        <button
                            onClick={() => setBulkConfirmModal({ ...bulkConfirmModal, isOpen: false })}
                            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmBulkAction}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
                        >
                            Confirm
                        </button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-primary bg-primary/10 p-4 rounded-xl border border-primary/20">
                        <ShieldAlert size={24} className="shrink-0" />
                        <p className="font-medium">Action Confirmation</p>
                    </div>
                    <p className="text-zinc-300">
                        {bulkConfirmModal.type === 'RESOLVE'
                            ? `Are you sure you want to resolve ${selectedIds.length} incidents?`
                            : `Are you sure you want to assign ${selectedIds.length} incidents to the selected admin?`
                        }
                    </p>
                </div>
            </Modal>

            <div className="space-y-3 pb-10">
                {isAdmin && (
                    <div className="px-5 py-2 flex items-center gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={filteredIncidents?.length > 0 && selectedIds.length === filteredIncidents.length}
                            className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary/50"
                        />
                        <span>Select All</span>
                    </div>
                )}

                {filteredIncidents?.map((incident: any) => (
                    <div key={incident._id} className={clsx("bg-zinc-900/40 p-5 rounded-xl border transition-all flex flex-col md:flex-row gap-6 group items-start relative overflow-visible", selectedIds.includes(incident._id) ? "border-primary/50 bg-primary/5" : "border-zinc-800/60 hover:border-zinc-700/80")}>

                        <div className={clsx("absolute left-0 top-0 bottom-0 w-1",
                            incident.priority === 'HIGH' ? 'bg-red-500/80' :
                                incident.priority === 'MEDIUM' ? 'bg-blue-500/80' : 'bg-green-500/80'
                        )} />

                        {isAdmin && (
                            <div className="flex items-center gap-4 pl-2 pt-1 h-full">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(incident._id)}
                                    onChange={() => handleSelectOne(incident._id)}
                                    className="mt-1 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary/50"
                                />
                            </div>
                        )}

                        <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">{incident.title}</h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
                                        <span className={clsx("px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide", PRIORITY_COLORS[incident.priority as keyof typeof PRIORITY_COLORS])}>
                                            {incident.priority}
                                        </span>
                                        <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
                                            <User size={12} />
                                            {incident.userId?.name || 'Anonymous'}
                                        </span>
                                        {incident.assignedTo && (
                                            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/20">
                                                Assigned to: {assignees?.find((a: any) => a._id === incident.assignedTo)?.name || 'Admin'}
                                            </span>
                                        )}
                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
                                            <Calendar size={12} />
                                            {format(new Date(incident.createdAt), 'MMM dd, HH:mm')}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <span className="text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-800">{incident.category}</span>
                                    </div>

                                    {incident.evidenceUrl && (
                                        <div className="mt-3">
                                            <a
                                                href={`${import.meta.env.VITE_UPLOAD_URL}${incident.evidenceUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FileText size={12} />
                                                View Evidence
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 max-w-3xl">
                                {incident.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 px-4 border-l border-zinc-800/50 self-center">
                            <div className="space-y-1 min-w-[140px]">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Status</label>
                                {isAdmin ? (
                                    <CustomSelect
                                        value={incident.status}
                                        onChange={(val) => updateMutation.mutate({ id: incident._id, status: val })}
                                        options={STATUS_OPTIONS}
                                        className="py-0"
                                    />
                                ) : (
                                    <span className={clsx("inline-block px-3 py-1 rounded-md text-sm font-medium border",
                                        incident.status === 'RESOLVED' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                            incident.status === 'IN_PROGRESS' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                                                'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                                    )}>
                                        {incident.status}
                                    </span>
                                )}
                            </div>

                            {isAdmin && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => handleMenuClick(e, incident._id)}
                                        className="p-2 text-zinc-500 hover:text-white transition-colors relative"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {activeMenu === incident._id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0c] border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleSingleAssign(incident._id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                                                >
                                                    <User size={14} />
                                                    Assign to...
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(incident._id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-zinc-800"
                                                >
                                                    <ShieldAlert size={14} />
                                                    Delete Incident
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredIncidents?.length === 0 && (
                    <div className="bg-zinc-900/30 p-16 rounded-xl border border-zinc-800/60 border-dashed text-center">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="text-zinc-500" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-300 mb-1">No incidents found</h3>
                        <p className="text-zinc-500 text-sm">Clear your filters to see more results.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncidentListPage;
