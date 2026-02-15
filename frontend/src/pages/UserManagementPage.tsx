import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomSelect from '../components/CustomSelect';
import api from '../api/client';
import Modal from '../components/Modal';
import {
    Users,
    UserMinus,
    UserCheck,
    Ban,
    AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';

const UserManagementPage = () => {
    const queryClient = useQueryClient();
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: '', userName: '' });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            await api.patch(`/users/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteModal({ isOpen: false, userId: '', userName: '' });
        }
    });

    if (isLoading) return <div className="animate-pulse">Loading users...</div>;

    return (
        <div className="space-y-6">
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, userId: '', userName: '' })}
                title="Confirm User Deletion"
                footer={
                    <>
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, userId: '', userName: '' })}
                            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => deleteMutation.mutate(deleteModal.userId)}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                        >
                            Delete User
                        </button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                        <AlertTriangle size={24} className="shrink-0" />
                        <p className="font-medium">Warning: This action cannot be undone.</p>
                    </div>
                    <p className="text-zinc-300">
                        Are you sure you want to permanently delete <strong className="text-white">{deleteModal.userName}</strong>?
                        This will remove all their data and access immediately.
                    </p>
                </div>
            </Modal>

            <div className="flex items-center justify-between glass p-8 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <Users className="text-primary" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">User Management</h2>
                        <p className="text-gray-500">Manage access and roles for all system users</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold">{users?.length}</p>
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">Total Users</p>
                </div>
            </div>

            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users?.map((user: any) => (
                            <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm w-48">
                                    <CustomSelect
                                        value={user.role}
                                        onChange={(val) => updateMutation.mutate({ id: user._id, data: { role: val } })}
                                        options={['USER', 'ADMIN', 'SUPER_ADMIN']}
                                        className="py-0"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                        user.isBlocked ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                                    )}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => updateMutation.mutate({ id: user._id, data: { isBlocked: !user.isBlocked } })}
                                            className={clsx(
                                                "p-2 rounded-lg transition-all",
                                                user.isBlocked ? "text-green-500 hover:bg-green-500/10" : "text-red-500 hover:bg-red-500/10"
                                            )}
                                            title={user.isBlocked ? "Unblock" : "Block"}
                                        >
                                            {user.isBlocked ? <UserCheck size={18} /> : <Ban size={18} />}
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, userId: user._id, userName: user.name })}
                                            className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementPage;
